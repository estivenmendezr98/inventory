import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AuditFilterState } from './AuditFilters';
import { downloadAuditExport } from '../audit-export';

interface AuditExportBarProps {
  filters: AuditFilterState;
  canExport: boolean;
  totalMatching?: number;
}

export function AuditExportBar({ filters, canExport, totalMatching }: AuditExportBarProps) {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPeriod = Boolean(filters.from.trim() && filters.to.trim());

  const run = async (format: 'csv' | 'pdf') => {
    setError(null);
    setExporting(format);
    try {
      await downloadAuditExport(filters, format);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar');
    } finally {
      setExporting(null);
    }
  };

  if (!canExport) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Exportar para auditoría legal</h2>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Genera un informe con datos de la empresa (NIT, razón social), periodo en horario de Bogotá, responsable
          de la exportación y detalle de cada evento. Incluye manifiesto y referencia a mensajes de datos (Ley 527 de
          1999). Use <strong className="font-medium text-foreground">CSV</strong> para análisis en Excel;{' '}
          <strong className="font-medium text-foreground">PDF</strong> para entregar impreso o firmado al revisor.
        </p>
      </div>

      {!hasPeriod && (
        <p className="text-sm text-amber-800 dark:text-amber-200 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          Seleccione <strong>fecha desde</strong> y <strong>fecha hasta</strong> en los filtros antes de exportar.
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!hasPeriod || exporting !== null}
          onClick={() => void run('csv')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
            'hover:opacity-90 disabled:opacity-50',
          )}
        >
          {exporting === 'csv' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Excel / CSV legal
        </button>
        <button
          type="button"
          disabled={!hasPeriod || exporting !== null}
          onClick={() => void run('pdf')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium',
            'hover:bg-muted/50 disabled:opacity-50',
          )}
        >
          {exporting === 'pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          PDF para entregar
        </button>
      </div>

      {hasPeriod && totalMatching != null && (
        <p className="text-xs text-muted-foreground">
          Coinciden {totalMatching.toLocaleString('es-CO')} registro(s) en el periodo con los filtros actuales.
        </p>
      )}
    </div>
  );
}
