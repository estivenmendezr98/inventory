import { Prisma } from '@prisma/client';
import { actionMeta, moduleLabel, type AuditActionMeta } from './audit-catalog';
import { AuditFieldChange, buildAuditFieldDiff } from './audit-diff.util';
import {
  buildPlainPresentation,
  enrichDiffForPeople,
  type AuditPlainPresentation,
} from './audit-plain-language';

type AuditRow = {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  entityId: string | null;
  entityType: string | null;
  oldData: Prisma.JsonValue;
  newData: Prisma.JsonValue;
  ipAddress: string | null;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: { name: string };
  } | null;
};

export interface AuditLogPresentation {
  moduleLabel: string;
  actionLabel: string;
  operation: AuditActionMeta['operation'];
  severity: AuditActionMeta['severity'];
  hint: string | null;
  summary: string;
  technicalSummary: string;
  plain: AuditPlainPresentation;
}

export type AuditFieldChangeEnriched = AuditFieldChange & {
  pathLabel: string;
  plainDescription: string;
};

export interface AuditLogEnriched {
  id: string;
  action: string;
  module: string;
  entityId: string | null;
  entityType: string | null;
  oldData: Prisma.JsonValue;
  newData: Prisma.JsonValue;
  ipAddress: string | null;
  createdAt: string;
  createdAtBogota: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleName: string | null;
  } | null;
  presentation: AuditLogPresentation;
  diff: AuditFieldChangeEnriched[];
  metrics: {
    diffCount: number;
    addedCount: number;
    removedCount: number;
    changedCount: number;
    hasOldPayload: boolean;
    hasNewPayload: boolean;
  };
}

function formatBogota(iso: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(iso);
}

function buildSummary(
  meta: AuditActionMeta,
  row: AuditRow,
  diff: AuditFieldChange[],
  permissionCodeMap?: Map<string, string>,
): { summary: string; technicalSummary: string } {
  const entity = row.entityType
    ? `${row.entityType}${row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}`
    : row.entityId ?? 'sin entidad';

  if (row.action === 'role.permissions_update') {
    const oldCodes = extractPermissionCodes(row.oldData, permissionCodeMap);
    const newCodes = extractPermissionCodes(row.newData, permissionCodeMap);
    const added = newCodes.filter((c) => !oldCodes.includes(c));
    const removed = oldCodes.filter((c) => !newCodes.includes(c));
    return {
      summary: `${meta.label}: +${added.length} permiso(s), −${removed.length}`,
      technicalSummary: `RBAC ${(row.oldData as { roleName?: string })?.roleName ?? 'rol'} · total ${oldCodes.length} → ${newCodes.length}`,
    };
  }

  if (row.action === 'sale.adjust') {
    const oldTotal = (row.oldData as { total?: string })?.total;
    const newTotal = (row.newData as { total?: string })?.total;
    const reason = (row.newData as { reason?: string })?.reason;
    return {
      summary: `Venta ajustada${oldTotal && newTotal ? `: $${oldTotal} → $${newTotal}` : ''}`,
      technicalSummary: `Sale ${row.entityId ?? '?'} · ${diff.length} campo(s) · motivo: ${reason ?? '—'}`,
    };
  }

  if (row.action === 'inventory.adjust') {
    const prev = (row.oldData as { previousQty?: number })?.previousQty;
    const next = (row.newData as { newQty?: number })?.newQty;
    return {
      summary: `Stock: ${prev ?? '?'} → ${next ?? '?'}`,
      technicalSummary: `Product ${row.entityId ?? '?'} · kardex manual`,
    };
  }

  if (row.action === 'user.sync_keycloak') {
    const stats = row.newData as { updated?: number; skipped?: number; totalKc?: number };
    return {
      summary: `Sync Keycloak: ${stats.updated ?? 0} actualizados, ${stats.skipped ?? 0} omitidos`,
      technicalSummary: `Realm total ${stats.totalKc ?? '?'} usuarios`,
    };
  }

  const changeHint =
    diff.length > 0
      ? `${diff.length} cambio(s) en payload`
      : meta.operation === 'DELETE'
        ? 'registro eliminado / desactivado'
        : 'sin diff estructurado';

  return {
    summary: `${meta.label} · ${entity}`,
    technicalSummary: `${row.module}/${row.action} · ${changeHint}`,
  };
}

function extractPermissionCodes(
  data: Prisma.JsonValue,
  map?: Map<string, string>,
): string[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.permissionCodes)) {
    return obj.permissionCodes.map(String).sort();
  }
  if (Array.isArray(obj.permissionIds) && map) {
    return (obj.permissionIds as string[])
      .map((id) => map.get(id) ?? id.slice(0, 8))
      .sort();
  }
  return [];
}

export function enrichAuditRow(
  row: AuditRow,
  permissionCodeMap?: Map<string, string>,
): AuditLogEnriched {
  const meta = actionMeta(row.action);
  const rawDiff = buildAuditFieldDiff(row.oldData, row.newData);
  const { summary, technicalSummary } = buildSummary(meta, row, rawDiff, permissionCodeMap);
  const createdAtBogota = formatBogota(row.createdAt);
  const diff = enrichDiffForPeople(rawDiff);
  const plain = buildPlainPresentation(
    {
      action: row.action,
      module: row.module,
      entityId: row.entityId,
      entityType: row.entityType,
      oldData: row.oldData,
      newData: row.newData,
      createdAtBogota,
      user: row.user
        ? {
            firstName: row.user.firstName,
            lastName: row.user.lastName,
            email: row.user.email,
            roleName: row.user.role?.name ?? null,
          }
        : null,
    },
    meta,
    rawDiff,
  );

  return {
    id: row.id,
    action: row.action,
    module: row.module,
    entityId: row.entityId,
    entityType: row.entityType,
    oldData: row.oldData,
    newData: row.newData,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt.toISOString(),
    createdAtBogota,
    user: row.user
      ? {
          id: row.user.id,
          email: row.user.email,
          firstName: row.user.firstName,
          lastName: row.user.lastName,
          roleName: row.user.role?.name ?? null,
        }
      : null,
    presentation: {
      moduleLabel: moduleLabel(row.module),
      actionLabel: meta.label,
      operation: meta.operation,
      severity: meta.severity,
      hint: meta.hint ?? null,
      summary,
      technicalSummary,
      plain,
    },
    diff,
    metrics: {
      diffCount: diff.length,
      addedCount: diff.filter((d) => d.kind === 'added').length,
      removedCount: diff.filter((d) => d.kind === 'removed').length,
      changedCount: diff.filter((d) => d.kind === 'changed').length,
      hasOldPayload: row.oldData != null,
      hasNewPayload: row.newData != null,
    },
  };
}

export function collectPermissionIdsFromRows(rows: AuditRow[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.action !== 'role.permissions_update') continue;
    for (const payload of [row.oldData, row.newData]) {
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const list = (payload as { permissionIds?: string[] }).permissionIds;
        if (Array.isArray(list)) list.forEach((id) => ids.add(id));
      }
    }
  }
  return [...ids];
}
