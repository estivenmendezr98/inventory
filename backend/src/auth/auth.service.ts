import { Injectable } from '@nestjs/common';
import { RoleName, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getSeedPermissionsForRole } from './role-seed-permissions';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sync user from Keycloak JWT payload to local database.
   * Creates user if not exists, updates lastLoginAt.
   */
  async syncUser(keycloakId: string, email: string, firstName: string, lastName: string, realmRoles: string[]) {
    // Determine role from Keycloak realm roles
    const roleName = this.mapKeycloakRole(realmRoles);

    // Find role in DB
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found in database`);
    }

    // Upsert user based on email (since seed creates users without keycloakId)
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        keycloakId,
        email,
        firstName,
        lastName,
        roleId: role.id,
        lastLoginAt: new Date(),
      },
      create: {
        keycloakId,
        email,
        firstName,
        lastName,
        roleId: role.id,
        isActive: true,
        lastLoginAt: new Date(),
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    return user;
  }

  /** Desactiva usuario local cuando Keycloak elimina o deshabilita la cuenta (webhook). */
  async markUserDisabledByKeycloakRef(params: { keycloakId?: string | null; email?: string }) {
    const or: Prisma.UserWhereInput[] = [];
    if (params.keycloakId) or.push({ keycloakId: params.keycloakId });
    if (params.email?.trim()) or.push({ email: params.email.trim().toLowerCase() });
    if (or.length === 0) return { updated: 0 };
    const r = await this.prisma.user.updateMany({
      where: { OR: or },
      data: { isActive: false },
    });
    return { updated: r.count };
  }

  /**
   * Get user permissions from database (normalized RolePermission table).
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user?.role) return [];

    if (user.role.name === RoleName.SUPER_ADMINISTRADOR) {
      const all = await this.prisma.permission.findMany({ select: { code: true } });
      return all.map((p) => p.code);
    }

    const fromDb =
      user.role.rolePermissions
        ?.filter((rp) => rp.permission != null)
        .map((rp) => rp.permission!.code) ?? [];

    const seed = getSeedPermissionsForRole(user.role.name);
    return [...new Set([...fromDb, ...seed])];
  }

  /**
   * Map Keycloak realm roles to local RoleName enum.
   */
  private mapKeycloakRole(realmRoles: string[]): 'SUPER_ADMINISTRADOR' | 'ADMINISTRADOR' | 'CAJERO' {
    if (realmRoles.includes('SUPER_ADMINISTRADOR')) return 'SUPER_ADMINISTRADOR';
    if (realmRoles.includes('ADMINISTRADOR')) return 'ADMINISTRADOR';
    if (realmRoles.includes('CAJERO')) return 'CAJERO';
    return 'CAJERO'; // default fallback
  }
}
