import type { AuditMetaResponse } from '../audit.types';
import { SEVERITY_STYLES, OPERATION_STYLES } from '../audit.ui';

export interface AuditFilterState {
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  q: string;
  from: string;
  to: string;
  severity: string;
  operation: string;
}

interface AuditFiltersProps {
  filters: AuditFilterState;
  meta: AuditMetaResponse | null;
  onChange: (patch: Partial<AuditFilterState>) => void;
  onReset: () => void;
}

export function AuditFilters({ filters, meta, onChange, onReset }: AuditFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Buscar en el historial</p>
        {meta && (
          <p className="text-xs text-muted-foreground">
            {meta.total.toLocaleString('es-CO')} evento(s) en el sistema
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Buscar por palabra</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="nombre, correo, venta, caja…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Módulo</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.module}
            onChange={(e) => onChange({ module: e.target.value })}
          >
            <option value="">Todos</option>
            {meta?.modules.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} ({m.count})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Acción</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.action}
            onChange={(e) => onChange({ action: e.target.value })}
          >
            <option value="">Todas</option>
            {meta?.actions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Tipo entidad</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.entityType}
            onChange={(e) => onChange({ entityType: e.target.value })}
          >
            <option value="">Todas</option>
            {meta?.entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Código interno (opcional)</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="solo si lo conoce"
            value={filters.entityId}
            onChange={(e) => onChange({ entityId: e.target.value })}
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Tipo de cambio</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.operation}
            onChange={(e) => onChange({ operation: e.target.value })}
          >
            <option value="">Todas</option>
            {meta?.operations.map((op) => (
              <option key={op} value={op}>
                {OPERATION_STYLES[op].label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Severidad</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.severity}
            onChange={(e) => onChange({ severity: e.target.value })}
          >
            <option value="">Todas</option>
            {meta?.severities.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_STYLES[s].label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Desde (Bogotá)</span>
          <input
            type="date"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.from}
            onChange={(e) => onChange({ from: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Hasta (Bogotá)</span>
          <input
            type="date"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.to}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
