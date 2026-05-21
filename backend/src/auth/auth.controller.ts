import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserSessionsService } from './user-sessions.service';
import { KeycloakWebhookService } from './keycloak-webhook.service';
import { KeycloakWebhookGuard } from './guards/keycloak-webhook.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userSessions: UserSessionsService,
    private readonly keycloakWebhookSvc: KeycloakWebhookService,
  ) {}

  /**
   * GET /api/auth/me
   * Returns current user info with permissions.
   * Requires valid JWT from Keycloak.
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: any) {
    const user = req.user;
    const permissions = await this.authService.getUserPermissions(user.id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      permissions,
      avatar: user.avatar,
      isActive: user.isActive,
    };
  }

  /** Registra sesión de aplicación (Fase 2 — inventario de sesiones). */
  @Post('sessions')
  @UseGuards(AuthGuard('jwt'))
  async registerSession(
    @Req() req: { user: { id: string } },
    @Headers('authorization') authorization: string | undefined,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    const m = /^Bearer\s+(.+)$/i.exec(authorization ?? '');
    if (!m?.[1]) {
      throw new UnauthorizedException('Authorization Bearer requerido');
    }
    return this.userSessions.registerFromBearer(req.user.id, m[1], ip, userAgent);
  }

  /** Cierra sesión(es) locales; use cabecera X-App-Session-Id para una concreta (la devuelve POST /auth/sessions). */
  @Delete('sessions/current')
  @UseGuards(AuthGuard('jwt'))
  async revokeSession(
    @Req() req: { user: { id: string } },
    @Headers('x-app-session-id') sessionId: string | string[] | undefined,
  ) {
    const sid = Array.isArray(sessionId) ? sessionId[0] : sessionId;
    return this.userSessions.revoke(req.user.id, sid ?? undefined);
  }

  /**
   * Webhook desde Keycloak (bridge HTTP / extensión). Secreto: cabecera X-Inventory-Webhook-Secret.
   * Cuerpo flexible: `operationType`, `resourceType`, `representation` (usuario Keycloak).
   */
  @Post('keycloak/webhook')
  @UseGuards(KeycloakWebhookGuard)
  async postKeycloakWebhook(@Body() body: Record<string, unknown>) {
    return this.keycloakWebhookSvc.handleAdminStyleEvent({
      operationType: typeof body.operationType === 'string' ? body.operationType : undefined,
      resourceType: typeof body.resourceType === 'string' ? body.resourceType : undefined,
      type: typeof body.type === 'string' ? body.type : undefined,
      representation:
        body.representation && typeof body.representation === 'object'
          ? (body.representation as Record<string, unknown>)
          : undefined,
    });
  }
}
