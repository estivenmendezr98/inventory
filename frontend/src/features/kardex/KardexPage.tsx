import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { BookOpen, Download, Search, X } from 'lucide-react';
import keycloak from '../../lib/keycloak';
import { buildApiUrl } from '../../lib/api';
import { cn } from '../../lib/utils';
import { DomainHubNav } from '../../components/domain/DomainHubNav';
import { KardexReferenceLink } from '../../components/domain/KardexReferenceLink';
import { ProductSelect } from '../../components/domain/ProductSelect';

interface KardexRow {
  id: string;
  type: string;
  typeLabel: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  baseUnitSymbol: string;
  operationalQuantity: number | null;
  operationalUnitSymbol: string | null;
  conversionFactor: number | null;
  unitCost: string;
  totalCost: string;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  product: { id: string; sku: string; name: string };
  user: { id: string; name: string; email: string };
}

interface ListResponse {
  data: KardexRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const HUB_LINKS = [
  { to: '/products', label: 'Productos', permission: 'products.view' },
  { to: '/inventory', label: 'Inventario', permission: 'inventory.view' },
  { to: '/purchases', label: 'Compras', permission: 'purchases.view' },
  { to: '/sales', label: 'Ventas', permission: 'sales.view' },
  { to: '/suppliers', label: 'Proveedores', permission: 'suppliers.view' },
];

function parseFilenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
  if (m?.[1]) return decodeURIComponent(m[1].replace(/"/g, '').trim());
  return fallback;
}

async function downloadKardexCsv(params: URLSearchParams): Promise<void> {
  const qs = params.toString();
  const url = buildApiUrl(`/kardex/export${qs ? `?${qs}` : ''}`);
  const token = keycloak.token;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const filename = parseFilenameFromDisposition(
    res.headers.get('Content-Disposition'),
    'kardex.csv'
  );
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

function typeBadge(type: string) {
  switch (type) {
    case 'IN':
      return 'bg-green-500/15 text-green-500';
    case 'OUT':
      return 'bg-red-500/15 text-red-400';
    case 'ADJUST':
      return 'bg-amber-500/15 text-amber-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function KardexPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<KardexRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') ?? '');
  const [productId, setProductId] = useState(() => searchParams.get('productId') ?? '');
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('type') ?? '');
  const [from, setFrom] = useState(() => searchParams.get('from') ?? '');
  const [to, setTo] = useState(() => searchParams.get('to') ?? '');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const referenceType = searchParams.get('referenceType') ?? '';
  const referenceId = searchParams.get('referenceId') ?? '';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, productId, typeFilter, from, to, referenceType, referenceId]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch.trim()) next.set('search', debouncedSearch.trim());
    if (productId) next.set('productId', productId);
    if (typeFilter) next.set('type', typeFilter);
    if (from) next.set('from', from);
    if (to) next.set('to', to);
    if (referenceType) next.set('referenceType', referenceType);
    if (referenceId) next.set('referenceId', referenceId);
    setSearchParams(next, { replace: true });
  }, [
    debouncedSearch,
    productId,
    typeFilter,
    from,
    to,
    referenceType,
    referenceId,
    setSearchParams,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (productId.trim()) params.set('productId', productId.trim());
    if (typeFilter) params.set('type', typeFilter);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (referenceType) params.set('referenceType', referenceType);
    if (referenceId) params.set('referenceId', referenceId);
    try {
      const res = await apiFetch<ListResponse>(`/kardex?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar kardex');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    productId,
    typeFilter,
    from,
    to,
    referenceType,
    referenceId,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (productId.trim()) params.set('productId', productId.trim());
    if (typeFilter) params.set('type', typeFilter);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (referenceType) params.set('referenceType', referenceType);
    if (referenceId) params.set('referenceId', referenceId);
    return params;
  }, [
    debouncedSearch,
    productId,
    typeFilter,
    from,
    to,
    referenceType,
    referenceId,
  ]);

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      await downloadKardexCsv(buildFilterParams());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al exportar kardex');
    } finally {
      setExporting(false);
    }
  };

  const clearDocFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('referenceType');
    next.delete('referenceId');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          Kardex
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Movimientos de inventario (entradas por compras, salidas por ventas y ajustes manuales).
        </p>
      </div>

      <DomainHubNav links={HUB_LINKS} />

      {(referenceType && referenceId) && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Filtrado por documento ({referenceType})
          </span>
          <button
            type="button"
            onClick={clearDocFilter}
            className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-0.5 text-xs hover:bg-accent"
          >
            <X className="h-3 w-3" />
            Quitar filtro
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por producto o SKU…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <ProductSelect value={productId} onChange={setProductId} />
        <label className="text-sm text-muted-foreground">
          Tipo
          <select
            className="mt-1 block w-full min-w-[9rem] rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="IN">Entrada</option>
            <option value="OUT">Salida</option>
            <option value="ADJUST">Ajuste</option>
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Desde
          <input
            type="date"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Hasta
          <input
            type="date"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exportando…' : 'Exportar CSV'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-center p-3 font-medium">Tipo</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Origen</th>
                  <th className="text-right p-3 font-medium">Mov. base</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">U.M.</th>
                  <th className="text-right p-3 font-medium hidden lg:table-cell">Operativo</th>
                  <th className="text-right p-3 font-medium hidden lg:table-cell">Stock</th>
                  <th className="text-right p-3 font-medium hidden md:table-cell">Costo total</th>
                  <th className="text-left p-3 font-medium hidden xl:table-cell">Usuario</th>
                  <th className="text-left p-3 font-medium hidden 2xl:table-cell">Notas</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground">
                      No hay movimientos con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{r.product.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{r.product.sku}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                            typeBadge(r.type)
                          )}
                        >
                          {r.typeLabel}
                        </span>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <KardexReferenceLink
                          referenceType={r.referenceType}
                          referenceId={r.referenceId}
                        />
                      </td>
                      <td
                        className={cn(
                          'p-3 text-right tabular-nums font-medium',
                          r.quantity > 0 && 'text-green-500',
                          r.quantity < 0 && 'text-red-400'
                        )}
                      >
                        {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
                      </td>
                      <td className="p-3 text-center text-muted-foreground hidden md:table-cell">
                        {r.baseUnitSymbol}
                      </td>
                      <td className="p-3 text-right tabular-nums hidden lg:table-cell text-xs">
                        {r.operationalQuantity != null && r.operationalUnitSymbol ? (
                          <span>
                            {r.operationalQuantity > 0 ? '+' : ''}
                            {r.operationalQuantity} {r.operationalUnitSymbol}
                            {r.conversionFactor != null && (
                              <span className="block text-muted-foreground">
                                ×{r.conversionFactor}
                              </span>
                            )}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-right text-muted-foreground hidden lg:table-cell tabular-nums text-xs">
                        {r.previousStock} → {r.newStock} {r.baseUnitSymbol}
                      </td>
                      <td className="p-3 text-right tabular-nums hidden md:table-cell">
                        {cop.format(Number(r.totalCost))}
                      </td>
                      <td className="p-3 text-muted-foreground hidden xl:table-cell text-xs">
                        {r.user.name}
                      </td>
                      <td
                        className="p-3 text-muted-foreground hidden 2xl:table-cell max-w-[200px] truncate text-xs"
                        title={r.notes || undefined}
                      >
                        {r.notes ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Página {meta.page} de {meta.totalPages} ({meta.total} movimientos)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-input px-3 py-1 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-input px-3 py-1 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}