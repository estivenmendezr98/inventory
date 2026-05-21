import { Info } from 'lucide-react';
import type { AuditLogRow } from '../audit.types';
import { plainOf } from '../audit.ui';
import { AuditSeverityBadge } from './AuditBadges';

interface AuditPlainSummaryProps {
  row: AuditLogRow;
  compact?: boolean;
}

export function AuditPlainSummary({ row, compact }: AuditPlainSummaryProps) {
  const p = plainOf(row);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4'}>
      {!compact && (
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Resumen para todos
        </p>
      )}
      <div>
        <h3 className={compact ? 'text-sm font-semibold leading-snug' : 'text-base font-semibold'}>
          {p.title}
        </h3>
        <p className={compact ? 'mt-1 text-sm text-muted-foreground line-clamp-2' : 'mt-2 text-sm text-foreground leading-relaxed'}>
          {p.story}
        </p>
      </div>

      {!compact && (
        <>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Quién lo hizo</dt>
              <dd className="font-medium">{p.who}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cuándo</dt>
              <dd>{p.when}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Área del sistema</dt>
              <dd>{p.area}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tipo de cambio</dt>
              <dd>{p.operationLabel}</dd>
            </div>
          </dl>

          {p.whatChanged.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground">Qué cambió</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {p.whatChanged.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 rounded-lg border border-border bg-background/80 p-3 text-sm">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden />
            <div>
              <p className="font-medium text-foreground">Por qué importa</p>
              <p className="mt-1 text-muted-foreground">{p.whyItMatters}</p>
              <p className="mt-2 flex items-center gap-2 text-xs">
                <AuditSeverityBadge severity={row.presentation.severity} />
                <span className="text-muted-foreground">{p.severityLabel}</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
