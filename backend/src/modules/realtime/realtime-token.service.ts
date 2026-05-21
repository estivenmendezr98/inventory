import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AuthService } from '../../auth/auth.service';

/**
 * Valida access tokens de Keycloak para conexiones Socket.IO (misma JWKS que HTTP JWT).
 */
@Injectable()
export class RealtimeTokenService {
  private readonly jwksUri: string;
  private readonly issuers: string[];
  private readonly client: jwksClient.JwksClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const kcBaseUrl = this.configService
      .get<string>('KC_BASE_URL', 'http://localhost:8080')
      .replace(/\/$/, '');
    const kcPublicUrl = (this.configService.get<string>('KC_PUBLIC_URL') || '').replace(/\/$/, '');
    const kcRealm = this.configService.get<string>('KC_REALM', 'inventory');

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

    this.jwksUri = `${kcBaseUrl}/realms/${kcRealm}/protocol/openid-connect/certs`;
    this.issuers = issuers;
    this.client = jwksClient({
      jwksUri: this.jwksUri,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  verifyAccessToken(token: string): Promise<jwt.JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          if (!header.kid) {
            callback(new Error('Token sin kid'));
            return;
          }
          this.client.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
              callback(err ?? new Error('Sin clave JWKS'));
              return;
            }
            callback(null, key.getPublicKey());
          });
        },
        {
          algorithms: ['RS256'],
          issuer:
            this.issuers.length === 1
              ? this.issuers[0]
              : (this.issuers as [string, ...string[]]),
        },
        (err, decoded) => {
          if (err || !decoded || typeof decoded === 'string') {
            reject(err ?? new UnauthorizedException('Token inválido'));
            return;
          }
          resolve(decoded);
        },
      );
    });
  }

  /** Replica la lógica de `JwtStrategy.validate` para sincronizar usuario local. */
  async syncUserFromPayload(payload: jwt.JwtPayload) {
    const keycloakId =
      (typeof payload.sub === 'string' && payload.sub) ||
      (typeof payload.sid === 'string' && payload.sid) ||
      (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
      (typeof payload.email === 'string' && payload.email);

    if (!keycloakId) {
      throw new UnauthorizedException('Token sin subject');
    }

    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    if (!email) {
      throw new UnauthorizedException('Token sin email');
    }

    const firstName = typeof payload.given_name === 'string' ? payload.given_name : '';
    const lastName = typeof payload.family_name === 'string' ? payload.family_name : '';
    const realmRolesRaw = [
      ...(Array.isArray((payload as { realm_roles?: string[] }).realm_roles)
        ? (payload as { realm_roles: string[] }).realm_roles
        : []),
      ...(Array.isArray(
        (payload as { realm_access?: { roles?: string[] } }).realm_access?.roles,
      )
        ? (payload as { realm_access: { roles: string[] } }).realm_access.roles
        : []),
    ];
    const realmRoles = [...new Set(realmRolesRaw)];

    return this.authService.syncUser(keycloakId, email, firstName, lastName, realmRoles);
  }
}
