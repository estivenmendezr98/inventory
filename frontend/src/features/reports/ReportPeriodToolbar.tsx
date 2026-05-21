import type { ReportPresetId } from '../../lib/report-date-presets';
import { REPORT_PRESET_OPTIONS } from '../../lib/report-date-presets';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

interface ReportPeriodToolbarProps {
  from: string;
  to: string;
  preset: ReportPresetId;
  periodLabel: string;
  top: number;
  loading: boolean;
  exporting: boolean;
  canExport: boolean;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onPresetChange: (p: ReportPresetId) => void;
  onTopChange: (n: number) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export function ReportPeriodToolbar({
  from,
  to,
  preset,
  periodLabel,
  top,
  loading,
  exporting,
  canExport,
  onFromChange,
  onToChange,
  onPresetChange,
  onTopChange,
  onRefresh,
  onExport,
}: ReportPeriodToolbarProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Período rápido</p>
        <div className="flex flex-wrap gap-2">
          {REPORT_PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPresetChange(opt.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                preset === opt.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
          {preset === 'custom' && (
            <span className="rounded-full border border-dashed border-amber-500/50 px-3 py-1 text-xs text-amber-700 dark:text-amber-400">
              Rango personalizado
            </span>
          )}
        </div>
        {preset !== 'custom' && (
          <p className="text-xs text-muted-foreground mt-2">{periodLabel} · hora Colombia</p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Top inventario
          <input
            type="number"
            min={1}
            max={100}
            value={top}
            onChange={(e) => onTopChange(Number(e.target.value) || 20)}
            className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <Button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Cargando…' : 'Actualizar'}
        </Button>
        {canExport && (
          <Button type="button" variant="outline" onClick={onExport} disabled={exporting}>
            {exporting ? 'Exportando…' : 'CSV ventas'}
          </Button>
        )}
      </div>
    </div>
  );
}
