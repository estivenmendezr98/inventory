import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class KeycloakWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('KEYCLOAK_WEBHOOK_SECRET', '').trim();
    if (!secret) {
      throw new ServiceUnavailableException(
        'Webhook Keycloak deshabilitado: defina KEYCLOAK_WEBHOOK_SECRET en el backend',
      );
    }
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['x-inventory-webhook-secret'];
    const value = Array.isArray(header) ? header[0] : header;
    if (value !== secret) {
      throw new UnauthorizedException('Secreto de webhook inválido');
    }
    return true;
  }
}
