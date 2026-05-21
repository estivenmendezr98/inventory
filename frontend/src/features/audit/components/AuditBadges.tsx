import { cn } from '../../../lib/utils';
import type { AuditOperation, AuditSeverity } from '../audit.types';
import { OPERATION_STYLES, SEVERITY_STYLES } from '../audit.ui';

export function AuditSeverityBadge({ severity }: { severity: AuditSeverity }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', s.className)}>
      {s.label}
    </span>
  );
}

export function AuditOperationBadge({ operation }: { operation: AuditOperation }) {
  const o = OPERATION_STYLES[operation];
  return (
    <span
      title={o.technical}
      className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold', o.className)}
    >
      {o.label}
    </span>
  );
}
