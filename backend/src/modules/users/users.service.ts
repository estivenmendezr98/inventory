import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { KeycloakAdminService } from '../../common/keycloak/keycloak-admin.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keycloakAdmin: KeycloakAdminService,
    private readonly audit: AuditService,
  ) {}

  private mapRow(u: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    keycloakId: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    role: { id: string; name: string; description: string | null };
  }) {
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      keycloakLinked: !!u.keycloakId,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      role: { id: u.role.id, name: u.role.name, description: u.role.description },
    };
  }

  async listRolesForForm() {
    const roles = await this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
    return { data: roles };
  }

  async findAll(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (!query.includeInactive) {
      where.isActive = true;
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { email: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: { role: { select: { id: true, name: true, description: true } } },
      }),
    ]);

    return {
      data: rows.map((r) => this.mapRow(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { select: { id: true, name: true, description: true } } },
    });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return this.mapRow(u);
  }

  /**
   * Sincroniza usuarios ya existentes en BD con datos actuales de Keycloak (nombres, keycloakId, rol de realm).
   * No crea usuarios nuevos en BD por seguridad (use alta desde la app o primer login JWT).
   */
  async syncFromKeycloak(actorUserId: string, ipAddress?: string) {
    const kcUsers = await this.keycloakAdmin.findRealmUsers({ max: 500 });
    let updated = 0;
    let skipped = 0;
    for (const ku of kcUsers) {
      if (!ku.id || !ku.email) {
        skipped++;
        continue;
      }
      const mappings = await this.keycloakAdmin.listRealmRoleMappingsForUser(ku.id);
      const roleNames = mappings.map((r) => r.name ?? '').filter(Boolean);
      const roleName = this.mapKcRealmRolesToEnum(roleNames);
      const role = await this.prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        skipped++;
        continue;
      }
      const email = ku.email.trim().toLowerCase();
      const existing = await this.prisma.user.findFirst({
        where: { OR: [{ keycloakId: ku.id }, { email }] },
      });
      if (!existing) {
        skipped++;
        continue;
      }
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          keycloakId: ku.id,
          email,
          firstName: ku.firstName ?? existing.firstName,
          lastName: ku.lastName ?? existing.lastName,
          roleId: role.id,
        },
      });
      updated++;
    }
    await this.audit.record({
      userId: actorUserId,
      action: 'user.sync_keycloak',
      module: 'users',
      entityId: actorUserId,
      entityType: 'User',
      oldData: null,
      newData: { updated, skipped, totalKc: kcUsers.length },
      ipAddress: ipAddress ?? null,
    });
    return { ok: true, updated, skipped, totalKeycloakUsers: kcUsers.length };
  }

  private mapKcRealmRolesToEnum(names: string[]): RoleName {
    if (names.includes('SUPER_ADMINISTRADOR')) return RoleName.SUPER_ADMINISTRADOR;
    if (names.includes('ADMINISTRADOR')) return RoleName.ADMINISTRADOR;
    if (names.includes('CAJERO')) return RoleName.CAJERO;
    return RoleName.CAJERO;
  }

  async create(dto: CreateUserDto, actorUserId: string, ipAddress?: string) {
    const email = dto.email.trim().toLowerCase();
    const dup = await this.prisma.user.findUnique({ where: { email } });
    if (dup) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, isActive: true },
    });
    if (!role) {
      throw new BadRequestException('Rol no válido o inactivo');
    }

    const created = await this.prisma.user.create({
      data: {
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.trim() || null,
        roleId: role.id,
        isActive: true,
      },
      include: { role: { select: { id: true, name: true, description: true } } },
    });

    try {
      const { keycloakUserId } = await this.keycloakAdmin.upsertRealmUserPassword({
        email,
        password: dto.password,
        firstName: created.firstName,
        lastName: created.lastName,
        realmRoleName: role.name,
      });
      const linked = await this.prisma.user.update({
        where: { id: created.id },
        data: { keycloakId: keycloakUserId },
        include: { role: { select: { id: true, name: true, description: true } } },
      });
      await this.audit.record({
        userId: actorUserId,
        action: 'user.create',
        module: 'users',
        entityId: linked.id,
        entityType: 'User',
        newData: {
          email: linked.email,
          roleId: linked.roleId,
          roleName: linked.role.name,
        },
        ipAddress: ipAddress ?? null,
      });
      return this.mapRow(linked);
    } catch (kcError) {
      await this.prisma.user.delete({ where: { id: created.id } });
      throw this.keycloakAdmin.wrapKeycloakFailure(kcError);
    }
  }

  async update(id: string, dto: UpdateUserDto, actorUserId: string, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    if (dto.isActive === false && id === actorUserId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    if (dto.roleId !== undefined && dto.roleId !== existing.roleId && id === actorUserId) {
      throw new BadRequestException('No puedes cambiar tu propio rol desde aquí');
    }

    const nextRoleId = dto.roleId ?? existing.roleId;
    const nextActive = dto.isActive !== undefined ? dto.isActive : existing.isActive;

    const keys = ['firstName', 'lastName', 'phone', 'roleId', 'isActive', 'password'] as const;
    if (!keys.some((k) => dto[k] !== undefined)) {
      throw new BadRequestException('Envía al menos un campo para actualizar');
    }

    await this.assertCanChangeSuperAdminSafeguard(id, existing, nextRoleId, nextActive);

    const oldData = {
      firstName: existing.firstName,
      lastName: existing.lastName,
      phone: existing.phone,
      roleId: existing.roleId,
      roleName: existing.role.name,
      isActive: existing.isActive,
    };

    let targetRoleName = existing.role.name;
    if (dto.roleId !== undefined) {
      const nextRole = await this.prisma.role.findFirst({
        where: { id: dto.roleId, isActive: true },
      });
      if (!nextRole) throw new BadRequestException('Rol no válido o inactivo');
      targetRoleName = nextRole.name;
    }

    const nextFirstName = dto.firstName !== undefined ? dto.firstName.trim() : existing.firstName;
    const nextLastName = dto.lastName !== undefined ? dto.lastName.trim() : existing.lastName;

    let newKeycloakId: string | undefined;
    if (dto.password) {
      try {
        const { keycloakUserId } = await this.keycloakAdmin.upsertRealmUserPassword({
          email: existing.email,
          password: dto.password,
          firstName: nextFirstName,
          lastName: nextLastName,
          realmRoleName: targetRoleName,
        });
        newKeycloakId = keycloakUserId;
      } catch (kcError) {
        throw this.keycloakAdmin.wrapKeycloakFailure(kcError);
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.phone !== undefined && {
          phone: dto.phone === null || dto.phone === '' ? null : dto.phone.trim(),
        }),
        ...(dto.roleId !== undefined && { roleId: dto.roleId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(newKeycloakId !== undefined && { keycloakId: newKeycloakId }),
      },
      include: { role: { select: { id: true, name: true, description: true } } },
    });

    await this.audit.record({
      userId: actorUserId,
      action: 'user.update',
      module: 'users',
      entityId: id,
      entityType: 'User',
      oldData,
      newData: {
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        roleId: updated.roleId,
        roleName: updated.role.name,
        isActive: updated.isActive,
        passwordChanged: !!dto.password,
      },
      ipAddress: ipAddress ?? null,
    });

    return this.mapRow(updated);
  }

  async softDelete(id: string, actorUserId: string, ipAddress?: string) {
    if (id === actorUserId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    await this.assertCanChangeSuperAdminSafeguard(id, existing, existing.roleId, false);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.record({
      userId: actorUserId,
      action: 'user.deactivate',
      module: 'users',
      entityId: id,
      entityType: 'User',
      oldData: { email: existing.email, isActive: existing.isActive, roleName: existing.role.name },
      newData: { isActive: false },
      ipAddress: ipAddress ?? null,
    });

    return { ok: true };
  }

  /**
   * Evita quedar sin ningún SUPER_ADMINISTRADOR activo.
   */
  private async assertCanChangeSuperAdminSafeguard(
    userId: string,
    existing: { role: { name: string }; isActive: boolean },
    nextRoleId: string,
    nextActive: boolean,
  ): Promise<void> {
    const superRole = await this.prisma.role.findUnique({
      where: { name: RoleName.SUPER_ADMINISTRADOR },
    });
    if (!superRole) return;

    const wasSuper = existing.role.name === RoleName.SUPER_ADMINISTRADOR && existing.isActive;
    if (!wasSuper) return;

    const becomesNonSuper = nextRoleId !== superRole.id;
    const becomesInactive = !nextActive;

    if (!becomesNonSuper && !becomesInactive) return;

    const otherActiveSupers = await this.prisma.user.count({
      where: {
        roleId: superRole.id,
        isActive: true,
        id: { not: userId },
      },
    });

    if (otherActiveSupers < 1) {
      throw new ForbiddenException(
        'No se puede dejar al sistema sin al menos un Super Administrador activo',
      );
    }
  }
}
