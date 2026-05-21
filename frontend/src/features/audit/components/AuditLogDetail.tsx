import { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import type { AuditLogRow } from '../audit.types';
import { AuditPlainSummary } from './AuditPlainSummary';
import { AuditDiffTable } from './AuditDiffTable';
import { copyText, formatJson } from '../audit.ui';
import { cn } from '../../../lib/utils';

interface AuditLogDetailProps {
  row: AuditLogRow;
}

function CopyableId({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{value}</code>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => {
          void copyText(value).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

export function AuditLogDetail({ row }: AuditLogDetailProps) {
  const [techOpen, setTechOpen] = useState(false);
  const [tab, setTab] = useState<'changes' | 'old' | 'new' | 'meta'>('changes');

  return (
    <div className="space-y-4 border-t border-border bg-muted/10 px-4 py-4">
      <AuditPlainSummary row={row} />

      <details
        className="rounded-lg border border-border bg-card"
        open={techOpen}
        onToggle={(e) => setTechOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform', techOpen && 'rotate-180')}
          />
          Detalle técnico (para soporte o desarrollo)
        </summary>
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
          <p className="font-mono text-xs text-muted-foreground">{row.presentation.technicalSummary}</p>
          <p className="text-xs text-muted-foreground">
            Código: <span className="font-mono">{row.module}</span> /{' '}
            <span className="font-mono">{row.action}</span>
            {row.presentation.hint && <> · {row.presentation.hint}</>}
          </p>

          <div className="flex flex-col gap-2">
            <CopyableId label="ID registro" value={row.id} />
            {row.entityId && (
              <CopyableId
                label={`Referencia interna (${row.entityType ?? 'entidad'})`}
                value={row.entityId}
              />
            )}
            {row.user && (
              <CopyableId
                label="Usuario en sistema"
                value={`${row.user.id} · ${row.user.email}`}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Equipo / red: {row.ipAddress ?? 'no registrada'}
            </p>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border pb-2">
            {(
              [
                ['changes', `Cambios (${row.metrics.diffCount})`],
                ['old', 'Datos anteriores (JSON)'],
                ['new', 'Datos nuevos (JSON)'],
                ['meta', 'Metadatos'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  tab === key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'changes' && <AuditDiffTable diff={row.diff} plainFirst />}
          {tab === 'old' && (
            <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed">
              {formatJson(row.oldData)}
            </pre>
          )}
          {tab === 'new' && (
            <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed">
              {formatJson(row.newData)}
            </pre>
          )}
          {tab === 'meta' && (
            <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px]">
              {formatJson({
                id: row.id,
                action: row.action,
                module: row.module,
                entityId: row.entityId,
                entityType: row.entityType,
                createdAt: row.createdAt,
                metrics: row.metrics,
                presentation: {
                  summary: row.presentation.summary,
                  technicalSummary: row.presentation.technicalSummary,
                },
              })}
            </pre>
          )}
        </div>
      </details>
    </div>
  );
}
