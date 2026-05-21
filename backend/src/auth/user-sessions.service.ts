import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

function jwtExpMs(token: string): number {
  try {
    const part = token.split('.')[1];
    if (!part) return 0;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

@Injectable()
export class UserSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una sesión de aplicación (referencia opaca; no persiste el JWT completo).
   */
  async registerFromBearer(
    userId: string,
    bearerToken: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ sessionId: string; expiresAt: string }> {
    const expMs = jwtExpMs(bearerToken);
    if (!expMs) {
      throw new UnauthorizedException('Token sin exp válido');
    }
    const sessionId = `sess_${randomUUID()}`;
    await this.prisma.userSession.create({
      data: {
        userId,
        accessToken: sessionId,
        refreshToken: null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        expiresAt: new Date(expMs),
        isActive: true,
      },
    });
    return { sessionId, expiresAt: new Date(expMs).toISOString() };
  }

  /**
   * Cierra sesiones: si se pasa sessionId solo esa fila; si no, todas las activas del usuario.
   */
  async revoke(userId: string, sessionId?: string | null) {
    if (sessionId?.startsWith('sess_')) {
      await this.prisma.userSession.updateMany({
        where: { userId, accessToken: sessionId, isActive: true },
        data: { isActive: false },
      });
      return { revoked: 'single' as const };
    }
    const r = await this.prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    return { revoked: 'all' as const, count: r.count };
  }
}
