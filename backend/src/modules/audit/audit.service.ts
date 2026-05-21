import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { bogotaDayBoundsFromYmd } from '../../common/utils/bogota-date.util';
import {
  collectPermissionIdsFromRows,
  enrichAuditRow,
  type AuditLogEnriched,
} from './audit-presenter';
import { AUDIT_ACTION_CATALOG, AUDIT_MODULE_LABELS } from './audit-catalog';

export type AuditRecordInput = {
  userId: string | null;
  action: string;
  module: string;
  entityId?: string | null;
  entityType?: string | null;
  oldData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action.slice(0, 255),
          module: input.module.slice(0, 64),
          entityId: input.entityId?.slice(0, 128) ?? null,
          entityType: input.entityType?.slice(0, 128) ?? null,
          oldData: input.oldData ?? undefined,
          newData: input.newData ?? undefined,
          ipAddress: input.ipAddress?.slice(0, 64) ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`No se pudo escribir audit_log: ${err instanceof Error ? err.message : err}`);
    }
  }

  async getMeta() {
    const [modules, actions, entityTypes, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        distinct: ['module'],
        select: { module: true },
        orderBy: { module: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['entityType'],
        where: { entityType: { not: null } },
        select: { entityType: true },
        orderBy: { entityType: 'asc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    const byModule = await this.prisma.auditLog.groupBy({
      by: ['module'],
      _count: { _all: true },
    });
    byModule.sort((a, b) => b._count._all - a._count._all);

    return {
      total,
      modules: modules.map((m) => ({
        value: m.module,
        label: AUDIT_MODULE_LABELS[m.module] ?? m.module,
        count: byModule.find((b) => b.module === m.module)?._count._all ?? 0,
      })),
      actions: actions.map((a) => ({
        value: a.action,
        label: AUDIT_ACTION_CATALOG[a.action]?.label ?? a.action,
      })),
      entityTypes: entityTypes
        .map((e) => e.entityType)
        .filter((t): t is string => !!t),
      operations: ['CREATE', 'UPDATE', 'DELETE', 'SYNC', 'OTHER'] as const,
      severities: ['low', 'medium', 'high', 'critical'] as const,
    };
  }

  async findOne(id: string): Promise<AuditLogEnriched> {
    const row = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: { select: { name: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Registro de auditoría no encontrado');
    const permissionMap = await this.buildPermissionCodeMap([row]);
    return enrichAuditRow(row, permissionMap);
  }

  /** Registros enriquecidos para exportación legal (orden cronológico ascendente). */
  async findEnrichedForExport(
    query: QueryAuditLogsDto,
    maxRows: number,
  ): Promise<{ rows: AuditLogEnriched[]; total: number }> {
    const where = this.buildWhere(query);
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: maxRows,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: { select: { name: true } },
            },
          },
        },
      }),
    ]);
    const permissionMap = await this.buildPermissionCodeMap(rows);
    return {
      total,
      rows: rows.map((r) => enrichAuditRow(r, permissionMap)),
    };
  }

  async findPage(query: QueryAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const permissionMap = await this.buildPermissionCodeMap(rows);
    const data = rows.map((r) => enrichAuditRow(r, permissionMap));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        filtersApplied: this.describeFilters(query),
      },
    };
  }

  private buildWhere(query: QueryAuditLogsDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.module?.trim()) {
      where.module = query.module.trim();
    }
    if (query.action?.trim()) {
      where.action = { contains: query.action.trim(), mode: 'insensitive' };
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.entityId?.trim()) {
      where.entityId = { contains: query.entityId.trim(), mode: 'insensitive' };
    }
    if (query.entityType?.trim()) {
      where.entityType = query.entityType.trim();
    }
    if (query.from?.trim() || query.to?.trim()) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.from?.trim()) {
        createdAt.gte = bogotaDayBoundsFromYmd(query.from.trim()).start;
      }
      if (query.to?.trim()) {
        createdAt.lte = bogotaDayBoundsFromYmd(query.to.trim()).end;
      }
      where.createdAt = createdAt;
    }

    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { module: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { entityType: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (query.severity?.trim()) {
      const actionsForSeverity = Object.entries(AUDIT_ACTION_CATALOG)
        .filter(([, m]) => m.severity === query.severity?.trim())
        .map(([code]) => code);
      if (actionsForSeverity.length > 0) {
        where.action = { in: actionsForSeverity };
      }
    }

    if (query.operation?.trim()) {
      const actionsForOp = Object.entries(AUDIT_ACTION_CATALOG)
        .filter(([, m]) => m.operation === query.operation?.trim())
        .map(([code]) => code);
      if (actionsForOp.length > 0) {
        const existingAction = where.action;
        if (existingAction && typeof existingAction === 'object' && 'in' in existingAction) {
          const set = new Set([
            ...(existingAction.in as string[]),
            ...actionsForOp,
          ]);
          where.action = { in: [...set] };
        } else if (!existingAction) {
          where.action = { in: actionsForOp };
        }
      }
    }

    return where;
  }

  /** Texto legible de filtros para manifiesto de exportación. */
  describeFiltersPublic(query: QueryAuditLogsDto): string {
    const parts = this.describeFilters(query);
    if (parts.length === 0) return '';
    return parts
      .map((p) => p.replace(/^(\w+)=/, '$1: ').replace('~', ' contiene '))
      .join('; ');
  }

  private describeFilters(query: QueryAuditLogsDto): string[] {
    const applied: string[] = [];
    if (query.module?.trim()) applied.push(`module=${query.module.trim()}`);
    if (query.action?.trim()) applied.push(`action~${query.action.trim()}`);
    if (query.entityType?.trim()) applied.push(`entityType=${query.entityType.trim()}`);
    if (query.entityId?.trim()) applied.push(`entityId~${query.entityId.trim()}`);
    if (query.userId) applied.push(`userId=${query.userId}`);
    if (query.q?.trim()) applied.push(`q~${query.q.trim()}`);
    if (query.from?.trim()) applied.push(`from=${query.from.trim()}`);
    if (query.to?.trim()) applied.push(`to=${query.to.trim()}`);
    if (query.severity?.trim()) applied.push(`severity=${query.severity.trim()}`);
    if (query.operation?.trim()) applied.push(`operation=${query.operation.trim()}`);
    return applied;
  }

  private async buildPermissionCodeMap(
    rows: { action: string; oldData: Prisma.JsonValue; newData: Prisma.JsonValue }[],
  ): Promise<Map<string, string>> {
    const ids = collectPermissionIdsFromRows(
      rows as Parameters<typeof collectPermissionIdsFromRows>[0],
    );
    if (ids.length === 0) return new Map();
    const perms = await this.prisma.permission.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    return new Map(perms.map((p) => [p.id, p.code]));
  }
}
