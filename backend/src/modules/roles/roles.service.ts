import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    const rows = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { rolePermissions: true, users: true } },
      },
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isActive: r.isActive,
        permissionCount: r._count.rolePermissions,
        userCount: r._count.users,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');

    const allPerms = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    const byModule = new Map<string, { id: string; code: string; name: string; description: string | null }[]>();
    for (const p of allPerms) {
      const list = byModule.get(p.module) ?? [];
      list.push({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
      });
      byModule.set(p.module, list);
    }

    const allPermissions = [...byModule.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, items]) => ({ module, items }));

    return {
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        userCount: role._count.users,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      },
      assignedPermissionIds: role.rolePermissions.map((rp) => rp.permissionId),
      allPermissions,
    };
  }

  async updatePermissions(roleId: string, dto: UpdateRolePermissionsDto, actorUserId: string, ipAddress?: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    const uniqueIds = [...new Set(dto.permissionIds)];
    const found = await this.prisma.permission.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (found.length !== uniqueIds.length) {
      throw new BadRequestException('Uno o más permisos no existen');
    }

    const previous = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
    const oldPermissionIds = previous.map((p) => p.permissionId).sort();

    const allPermRows = await this.prisma.permission.findMany({
      where: { id: { in: [...new Set([...oldPermissionIds, ...uniqueIds])] } },
      select: { id: true, code: true },
    });
    const codeById = new Map(allPermRows.map((p) => [p.id, p.code]));

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: uniqueIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ]);

    const newPermissionIds = [...uniqueIds].sort();
    await this.audit.record({
      userId: actorUserId,
      action: 'role.permissions_update',
      module: 'roles',
      entityId: roleId,
      entityType: 'Role',
      oldData: {
        roleName: role.name,
        permissionIds: oldPermissionIds,
        permissionCodes: oldPermissionIds.map((id) => codeById.get(id) ?? id),
      },
      newData: {
        roleName: role.name,
        permissionIds: newPermissionIds,
        permissionCodes: newPermissionIds.map((id) => codeById.get(id) ?? id),
      },
      ipAddress: ipAddress ?? null,
    });

    return this.findOne(roleId);
  }
}
