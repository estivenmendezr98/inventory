import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const kcBaseUrl = configService
      .get<string>('KC_BASE_URL', 'http://localhost:8080')
      .replace(/\/$/, '');
    /** URL pública del navegador (SPA); el `iss` del token suele coincidir con esta, no con el hostname Docker. */
    const kcPublicUrl = (configService.get<string>('KC_PUBLIC_URL') || '').replace(/\/$/, '');
    const kcRealm = configService.get<string>('KC_REALM', 'inventory');

    const internalIssuer = `${kcBaseUrl}/realms/${kcRealm}`;
    const issuers: string[] = [internalIssuer];
    const publicIssuer = kcPublicUrl ? `${kcPublicUrl}/realms/${kcRealm}` : '';
    if (publicIssuer && publicIssuer !== internalIssuer) {
      issuers.push(publicIssuer);
    }
    if (kcPublicUrl?.includes('localhost')) {
      const alt = `${kcPublicUrl.replace('localhost', '127.0.0.1')}/realms/${kcRealm}`;
      if (!issuers.includes(alt)) {
        issuers.push(alt);
      }
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${kcBaseUrl}/realms/${kcRealm}/protocol/openid-connect/certs`,
      }),
      issuer: issuers.length === 1 ? issuers[0] : issuers,
      algorithms: ['RS256'],
    });
  }

  /**
   * Validate JWT payload from Keycloak.
   * Syncs user to local DB and returns enriched user object.
   */
  async validate(payload: any) {
    const keycloakId = payload.sub || payload.sid || payload.preferred_username || payload.email;

    if (!keycloakId) {
      console.error('Invalid token payload:', payload);
      throw new UnauthorizedException('Invalid token: missing subject (sub, sid, or email)');
    }

    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    if (!email) {
      throw new UnauthorizedException(
        'El token no incluye email. En Keycloak, el cliente inventory-app debe tener el scope «email» (client scope por defecto).',
      );
    }
    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';
    const realmRolesRaw = [
      ...(Array.isArray(payload.realm_roles) ? payload.realm_roles : []),
      ...(Array.isArray(payload.realm_access?.roles) ? payload.realm_access.roles : []),
    ];
    const realmRoles = [...new Set(realmRolesRaw)];

    try {
      const user = await this.authService.syncUser(
        keycloakId,
        email,
        firstName,
        lastName,
        realmRoles,
      );

      if (!user.isActive) {
        throw new UnauthorizedException('User account is disabled');
      }

      return user;
    } catch (error) {
      console.error('Error syncing user:', error);
      throw new UnauthorizedException('Failed to validate user');
    }
  }
}
