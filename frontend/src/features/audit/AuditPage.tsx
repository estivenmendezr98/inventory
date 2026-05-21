import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch } from '../../lib/api';
import { BookOpen, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { plainOf } from './audit.ui';
import type { AuditListResponse, AuditLogRow, AuditMetaResponse } from './audit.types';
import { AuditFilters, type AuditFilterState } from './components/AuditFilters';
import { AuditLogDetail } from './components/AuditLogDetail';
import { AuditOperationBadge, AuditSeverityBadge } from './components/AuditBadges';
import { AuditExportBar } from './components/AuditExportBar';

const EMPTY_FILTERS: AuditFilterState = {
  module: '',
  action: '',
  entityType: '',
  entityId: '',
  q: '',
  from: '',
  to: '',
  severity: '',
  operation: '',
};

function buildParams(page: number, filters: AuditFilterState): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), limit: '50' });
  if (filters.module.trim()) params.set('module', filters.module.trim());
  if (filters.action.trim()) params.set('action', filters.action.trim());
  if (filters.entityType.trim()) params.set('entityType', filters.entityType.trim());
  if (filters.entityId.trim()) params.set('entityId', filters.entityId.trim());
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.from.trim()) params.set('from', filters.from.trim());
  if (filters.to.trim()) params.set('to', filters.to.trim());
  if (filters.severity.trim()) params.set('severity', filters.severity.trim());
  if (filters.operation.trim()) params.set('operation', filters.operation.trim());
  return params;
}

export function AuditPage() {
  const { hasPermission } = useAuthStore();
  const canView = hasPermission('audit.view');
  const canExport = hasPermission('audit.export');

  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [meta, setMeta] = useState<AuditListResponse['meta'] | null>(null);
  const [catalog, setCatalog] = useState<AuditMetaResponse | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilterState>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const loadCatalog = useCallback(async () => {
    if (!canView) return;
    try {
      const res = await apiFetch<AuditMetaResponse>('/audit/meta');
      setCatalog(res);
    } catch {
      /* catálogo opcional */
    }
  }, [canView]);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(page, filters);
      const res = await apiFetch<AuditListResponse>(`/audit/logs?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  }, [canView, page, filters]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const patchFilters = (patch: Partial<AuditFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  if (!canView) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No tienes permiso para ver la auditoría del sistema.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Historial de qué pasó en el sistema, en lenguaje claro para cualquier persona. Si necesitas soporte o desarrollo, abre el detalle técnico de cada fila.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-secondary/80 disabled:opacity-50',
          )}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      <AuditFilters
        filters={filters}
        meta={catalog}
        onChange={patchFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />

      <AuditExportBar filters={filters} canExport={canExport} totalMatching={meta?.total} />


      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="w-10 px-3 py-3" aria-hidden />
                <th className="px-3 py-3 font-medium">Fecha (Bogotá)</th>
                <th className="px-3 py-3 font-medium">Qué pasó</th>
                <th className="px-3 py-3 font-medium">Importancia</th>
                <th className="px-3 py-3 font-medium">Quién</th>
                <th className="px-3 py-3 font-medium">Área</th>
                <th className="px-3 py-3 font-medium">Cambios</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    No hay registros que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const plain = plainOf(r);
                  const open = expandedId === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr className="border-b border-border/80 hover:bg-muted/20">
                        <td className="px-1 py-2">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-expanded={open}
                            aria-label={open ? 'Ocultar detalle' : 'Ver qué pasó y detalle técnico'}
                            onClick={() => setExpandedId(open ? null : r.id)}
                          >
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="font-mono text-xs text-foreground">{r.createdAtBogota}</div>
                          <div className="text-[10px] text-muted-foreground" title={r.createdAt}>
                            {r.id.slice(0, 8)}…
                          </div>
                        </td>
                        <td className="max-w-[280px] px-3 py-2">
                          <p className="font-medium leading-snug">{r.presentation.plain.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {r.presentation.plain.story}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <AuditSeverityBadge severity={r.presentation.severity} />
                            <span className="text-[10px] text-muted-foreground leading-tight">
                              {r.presentation.plain.severityLabel}
                            </span>
                            <AuditOperationBadge operation={r.presentation.operation} />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {r.user ? (
                            <div>
                              <div className="font-medium text-sm">
                                {r.user.firstName} {r.user.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">{r.user.email}</div>
                              {r.user.roleName && (
                                <div className="mt-0.5 text-[10px] text-muted-foreground capitalize">
                                  {r.user.roleName.replace(/_/g, ' ').toLowerCase()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">El sistema</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">{r.presentation.plain.area}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {r.presentation.plain.whatChanged.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5 max-w-[220px]">
                              {r.presentation.plain.whatChanged.slice(0, 2).map((line, i) => (
                                <li key={i} className="line-clamp-2">
                                  {line}
                                </li>
                              ))}
                              {r.presentation.plain.whatChanged.length > 2 && (
                                <li className="list-none pl-0 text-[10px]">
                                  +{r.presentation.plain.whatChanged.length - 2} más…
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <AuditLogDetail row={r} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {meta.total.toLocaleString('es-CO')} registro{meta.total !== 1 ? 's' : ''} · Página {meta.page} de{' '}
            {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
              disabled={page >= meta.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
