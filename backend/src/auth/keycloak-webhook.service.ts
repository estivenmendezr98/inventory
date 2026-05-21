import { Injectable, Logger } from '@nestjs/common';
import { KeycloakAdminService } from '../common/keycloak/keycloak-admin.service';
import { AuthService } from './auth.service';

@Injectable()
export class KeycloakWebhookService {
  private readonly logger = new Logger(KeycloakWebhookService.name);

  constructor(
    private readonly kcAdmin: KeycloakAdminService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Eventos estilo Admin REST (p. ej. extension HTTP): `operationType`, `resourceType`, `representation`.
   */
  async handleAdminStyleEvent(body: {
    operationType?: string;
    resourceType?: string;
    type?: string;
    representation?: Record<string, unknown>;
  }): Promise<{ ok: boolean; action: string }> {
    const op = (body.operationType ?? body.type ?? '').toUpperCase();
    const resType = (body.resourceType ?? '').toUpperCase();
    const rep = body.representation ?? {};

    if (resType && resType !== 'USER') {
      return { ok: true, action: 'ignored_resource_type' };
    }

    const userId = typeof rep.id === 'string' ? rep.id : null;
    const emailRaw =
      typeof rep.email === 'string' ? rep.email : typeof rep.username === 'string' ? rep.username : '';
    const email = emailRaw.trim().toLowerCase();

    if (op === 'DELETE' || op === 'USER_DELETE' || op === 'REMOVE') {
      if (!userId && !email) {
        return { ok: false, action: 'delete_missing_identity' };
      }
      await this.authService.markUserDisabledByKeycloakRef({ keycloakId: userId, email });
      return { ok: true, action: 'user_disabled' };
    }

    if (!userId || !email) {
      return { ok: false, action: 'missing_identity' };
    }

    try {
      const kcUser = await this.kcAdmin.findRealmUserById(userId);
      if (!kcUser?.id || !kcUser.email) {
        this.logger.warn(`Webhook USER ${op}: usuario ${userId} no encontrado en Keycloak`);
        return { ok: true, action: 'kc_user_not_found' };
      }
      const roles = await this.kcAdmin.listRealmRoleMappingsForUser(kcUser.id);
      const realmRoles = roles.map((r) => r.name ?? '').filter(Boolean) as string[];
      await this.authService.syncUser(
        kcUser.id,
        kcUser.email.trim().toLowerCase(),
        kcUser.firstName ?? '',
        kcUser.lastName ?? '',
        realmRoles,
      );
      return { ok: true, action: `user_${op || 'UPSERT'}`.toLowerCase() };
    } catch (e) {
      this.logger.error(`Webhook sync falló: ${e instanceof Error ? e.message : e}`);
      throw e;
    }
  }
}
