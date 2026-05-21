import type { AuditFieldChange } from '../audit.types';
import { DIFF_KIND_STYLES } from '../audit.ui';
import { cn } from '../../../lib/utils';

interface AuditDiffTableProps {
  diff: AuditFieldChange[];
  compact?: boolean;
  plainFirst?: boolean;
}

export function AuditDiffTable({ diff, compact, plainFirst = true }: AuditDiffTableProps) {
  if (diff.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay detalle campo por campo para este evento.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] text-left text-xs">
        <thead className="border-b border-border bg-muted/40 text-muted-foreground">
          <tr>
            {plainFirst && <th className="px-3 py-2 font-medium">En palabras simples</th>}
            <th className="px-3 py-2 font-medium">Campo</th>
            <th className="px-3 py-2 font-medium w-24">Tipo</th>
            {!plainFirst && (
              <>
                <th className="px-3 py-2 font-medium">Anterior</th>
                <th className="px-3 py-2 font-medium">Nuevo</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {diff.map((d) => {
            const style = DIFF_KIND_STYLES[d.kind];
            return (
              <tr key={`${d.path}-${d.kind}`} className={cn('border-b border-border/60', style.rowClass)}>
                {plainFirst && (
                  <td className="max-w-xs px-3 py-2 text-sm text-foreground">
                    {d.plainDescription ?? '—'}
                  </td>
                )}
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">{d.pathLabel ?? d.path}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{d.path}</div>
                </td>
                <td className="px-3 py-2">
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', style.badgeClass)}>
                    {style.label}
                  </span>
                </td>
                {!plainFirst && (
                  <>
                    <td
                      className={cn(
                        'max-w-[200px] truncate px-3 py-2 font-mono text-muted-foreground',
                        compact && 'max-w-[140px]',
                      )}
                      title={d.oldDisplay}
                    >
                      {d.oldDisplay}
                    </td>
                    <td
                      className={cn(
                        'max-w-[200px] truncate px-3 py-2 font-mono text-foreground',
                        compact && 'max-w-[140px]',
                      )}
                      title={d.newDisplay}
                    >
                      {d.newDisplay}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
