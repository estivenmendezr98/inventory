import type { ReportSeriesRow } from './reports.types';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

interface ReportSeriesChartProps {
  rows: ReportSeriesRow[];
  granularity: string;
}

export function ReportSeriesChart({ rows, granularity }: ReportSeriesChartProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin movimiento en el período.</p>;
  }

  const max = Math.max(...rows.map((r) => Number(r.total)), 1);

  const granLabel =
    granularity === 'month' ? 'por mes' : granularity === 'week' ? 'por semana' : 'por día';

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Evolución {granLabel}</p>
      <div className="flex items-end gap-1 h-28 overflow-x-auto pb-1">
        {rows.map((row) => {
          const h = Math.max(6, Math.round((Number(row.total) / max) * 96));
          return (
            <div
              key={row.bucket}
              className="flex min-w-[28px] max-w-[48px] flex-1 flex-col items-center gap-1"
              title={`${row.label}: ${cop.format(Number(row.total))} (${row.count})`}
            >
              <div
                className="w-full rounded-t bg-primary/80 transition-all"
                style={{ height: `${h}px` }}
              />
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {row.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
