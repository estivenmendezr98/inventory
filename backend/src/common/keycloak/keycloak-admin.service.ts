import {
  Injectable,
  OnModuleInit,
  Logger,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleName } from '@prisma/client';
import KcAdminClient from '@keycloak/keycloak-admin-client';

export interface UpsertRealmUserPasswordParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  realmRoleName: RoleName;
}

/** Decodifica `exp` del JWT sin dependencias extra. */
function jwtExpSec(token: string): number {
  try {
    const part = token.split('.')[1];
    if (!part) return 0;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp : 0;
  } catch {
    return 0;
  }
}

@Injectable()
export class KeycloakAdminService implements OnModuleInit {
  private readonly logger = new Logger(KeycloakAdminService.name);
  /** Token contra el realm de administración (casi siempre `master`). */
  private authClient!: KcAdminClient;
  /** Peticiones Admin API sobre el realm de la aplicación (`inventory`). */
  private apiClient!: KcAdminClient;
  private adminRealm!: string;
  private targetRealm!: string;
  private authMode: 'none' | 'client_credentials' | 'password' = 'none';
  private cachedAccessToken: string | null = null;
  private cachedAccessTokenExp = 0;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const baseUrl = this.configService.get<string>('KC_BASE_URL', 'http://localhost:8080').replace(/\/$/, '');
    this.adminRealm = this.configService.get<string>('KC_ADMIN_REALM', 'master');
    this.targetRealm = this.configService.get<string>('KC_REALM', 'inventory');

    this.authClient = new KcAdminClient({
      baseUrl,
      realmName: this.adminRealm,
    });
    this.apiClient = new KcAdminClient({
      baseUrl,
      realmName: this.targetRealm,
    });

    this.apiClient.registerTokenProvider({
      getAccessToken: () => this.obtainAccessTokenForApi(),
    });

    await this.performAuthOnAuthRealm();

    setInterval(() => {
      void this.refreshAuth();
    }, 58 * 1000);
  }

  /**
   * Obtiene un access token del realm de admin y lo reutiliza para el cliente del realm app.
   */
  private async obtainAccessTokenForApi(): Promise<string | undefined> {
    if (this.authMode === 'none') {
      return undefined;
    }
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedAccessToken && now < this.cachedAccessTokenExp - 25) {
      return this.cachedAccessToken;
    }
    await this.performAuthOnAuthRealm();
    const t = this.authClient.accessToken;
    if (!t) {
      return undefined;
    }
    this.cachedAccessToken = t;
    this.cachedAccessTokenExp = jwtExpSec(t);
    return t;
  }

  private async performAuthOnAuthRealm() {
    const clientSecret = this.configService.get<string>('KC_ADMIN_CLI_SECRET', '');
    if (clientSecret) {
      try {
        await this.authClient.auth({
          grantType: 'client_credentials',
          clientId: 'admin-cli',
          clientSecret,
        });
        this.authMode = 'client_credentials';
        this.logger.log(
          `Keycloak Admin autenticado (client_credentials, realm=${this.adminRealm})`,
        );
        return;
      } catch (error) {
        this.logger.warn('client_credentials falló, se intentará contraseña de admin', error);
      }
    }
    try {
      await this.authClient.auth({
        grantType: 'password',
        clientId: 'admin-cli',
        username: this.configService.get<string>('KC_ADMIN_USER', 'admin'),
        password: this.configService.get<string>('KC_ADMIN_PASSWORD', 'admin'),
      });
      this.authMode = 'password';
      this.logger.log(`Keycloak Admin autenticado (password grant, realm=${this.adminRealm})`);
    } catch (err) {
      this.logger.error(
        `Keycloak Admin no pudo autenticarse en el realm «${this.adminRealm}» (usuario/contraseña de administrador de Keycloak, no los del app).`,
        err,
      );
      this.authMode = 'none';
      this.cachedAccessToken = null;
    }
  }

  private async refreshAuth() {
    if (this.authMode === 'none') return;
    this.cachedAccessToken = null;
    try {
      await this.performAuthOnAuthRealm();
    } catch (err) {
      this.logger.error('Error al refrescar token de Keycloak Admin', err);
    }
  }

  /** Cliente configurado para el realm de la app (token inyectado desde el realm admin). */
  getClient() {
    return this.apiClient;
  }

  async upsertRealmUserPassword(params: UpsertRealmUserPasswordParams): Promise<{ keycloakUserId: string }> {
    if (this.authMode === 'none') {
      throw new ServiceUnavailableException(
        `Keycloak Admin no está autenticado. El usuario «${this.configService.get('KC_ADMIN_USER', 'admin')}» debe existir en el realm «${this.adminRealm}» (por defecto master). ` +
          'Configura KC_BASE_URL, KC_ADMIN_REALM, KC_REALM y KC_ADMIN_CLI_SECRET o KC_ADMIN_USER/KC_ADMIN_PASSWORD.',
      );
    }

    const token = await this.obtainAccessTokenForApi();
    if (!token) {
      throw new ServiceUnavailableException(
        'No se pudo obtener token de Keycloak Admin. Revisa credenciales y KC_ADMIN_REALM (normalmente master).',
      );
    }

    const kc = this.apiClient;
    const email = params.email.trim().toLowerCase();

    const realmRole = await kc.roles.findOneByName({ name: params.realmRoleName });
    if (!realmRole?.id || !realmRole.name) {
      throw new ServiceUnavailableException(
        `En Keycloak no existe el rol de realm "${params.realmRoleName}". Créalo en el realm «${this.targetRealm}».`,
      );
    }

    const rolePayload = { id: realmRole.id, name: realmRole.name };

    const existing = await kc.users.find({ email, exact: true });
    if (existing.length > 0 && existing[0].id) {
      const id = existing[0].id;
      await kc.users.update(
        { id },
        {
          email,
          username: email,
          firstName: params.firstName,
          lastName: params.lastName,
          enabled: true,
        },
      );
      await kc.users.resetPassword({
        id,
        credential: { temporary: false, type: 'password', value: params.password },
      });
      const mappings = await kc.users.listRealmRoleMappings({ id });
      const hasRole = mappings.some((r) => r.name === params.realmRoleName);
      if (!hasRole) {
        await kc.users.addRealmRoleMappings({ id, roles: [rolePayload] });
      }
      return { keycloakUserId: id };
    }

    const created = await kc.users.create({
      username: email,
      email,
      firstName: params.firstName,
      lastName: params.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{ temporary: false, type: 'password', value: params.password }],
    });

    const newId = created?.id;
    if (!newId) {
      throw new ServiceUnavailableException('Keycloak no devolvió el id del usuario creado');
    }

    await kc.users.addRealmRoleMappings({ id: newId, roles: [rolePayload] });

    return { keycloakUserId: newId };
  }

  private kcErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'responseData' in err) {
      const d = (err as { responseData?: unknown }).responseData;
      if (d !== undefined && d !== '') {
        return typeof d === 'string' ? d : JSON.stringify(d);
      }
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Error desconocido al hablar con Keycloak';
  }

  wrapKeycloakFailure(err: unknown): never {
    if (err instanceof HttpException) {
      throw err;
    }
    this.logger.error(this.kcErrorMessage(err), err);
    throw new ServiceUnavailableException(`Keycloak: ${this.kcErrorMessage(err)}`);
  }

  /** Lista usuarios del realm de la app (Admin API). */
  async findRealmUsers(params?: { first?: number; max?: number }) {
    if (this.authMode === 'none') {
      throw new ServiceUnavailableException('Keycloak Admin no está autenticado');
    }
    const kc = this.apiClient;
    return kc.users.find({ first: params?.first ?? 0, max: params?.max ?? 200 });
  }

  async findRealmUserById(id: string) {
    if (this.authMode === 'none') {
      throw new ServiceUnavailableException('Keycloak Admin no está autenticado');
    }
    return this.apiClient.users.findOne({ id });
  }

  async listRealmRoleMappingsForUser(userId: string) {
    if (this.authMode === 'none') {
      throw new ServiceUnavailableException('Keycloak Admin no está autenticado');
    }
    return this.apiClient.users.listRealmRoleMappings({ id: userId });
  }
}
