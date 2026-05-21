import type { AuditDiffKind, AuditLogRow, AuditOperation, AuditPlainPresentation, AuditSeverity } from './audit.types';

export const SEVERITY_STYLES: Record<
  AuditSeverity,
  { label: string; className: string }
> = {
  low: { label: 'Baja', className: 'bg-slate-500/15 text-slate-700 dark:text-slate-300' },
  medium: { label: 'Media', className: 'bg-blue-500/15 text-blue-800 dark:text-blue-200' },
  high: { label: 'Alta', className: 'bg-amber-500/15 text-amber-900 dark:text-amber-100' },
  critical: { label: 'Crítica', className: 'bg-destructive/15 text-destructive' },
};

export const OPERATION_STYLES: Record<
  AuditOperation,
  { label: string; technical: string; className: string }
> = {
  CREATE: { label: 'Creación', technical: 'CREATE', className: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200' },
  UPDATE: { label: 'Modificación', technical: 'UPDATE', className: 'bg-sky-500/15 text-sky-800 dark:text-sky-200' },
  DELETE: { label: 'Eliminación', technical: 'DELETE', className: 'bg-destructive/15 text-destructive' },
  SYNC: { label: 'Sincronización', technical: 'SYNC', className: 'bg-violet-500/15 text-violet-800 dark:text-violet-200' },
  OTHER: { label: 'Otro', technical: 'OTHER', className: 'bg-muted text-muted-foreground' },
};

export const DIFF_KIND_STYLES: Record<
  AuditDiffKind,
  { label: string; rowClass: string; badgeClass: string }
> = {
  added: {
    label: 'Nuevo',
    rowClass: 'bg-emerald-500/5',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  },
  removed: {
    label: 'Eliminado',
    rowClass: 'bg-destructive/5',
    badgeClass: 'bg-destructive/15 text-destructive',
  },
  changed: {
    label: 'Modificado',
    rowClass: 'bg-amber-500/5',
    badgeClass: 'bg-amber-500/15 text-amber-900 dark:text-amber-100',
  },
};

export function formatJson(value: unknown): string {
  if (value == null) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Compatibilidad si la API aún no envía `presentation.plain`. */
export function plainOf(row: AuditLogRow): AuditPlainPresentation {
  if (row.presentation.plain) return row.presentation.plain;
  return {
    title: row.presentation.summary,
    story: row.presentation.technicalSummary,
    who: row.user ? `${row.user.firstName} ${row.user.lastName}`.trim() || row.user.email : 'El sistema',
    when: row.createdAtBogota,
    area: row.presentation.moduleLabel,
    whatChanged: [],
    whyItMatters: row.presentation.hint ?? 'Registro de control del sistema.',
    operationLabel: 'Cambio registrado',
    severityLabel: 'Consulte el detalle',
  };
}
