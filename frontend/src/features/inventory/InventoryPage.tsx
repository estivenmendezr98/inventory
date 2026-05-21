import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, apiPost } from '../../lib/api';
import { BookOpen, Search, SlidersHorizontal, Warehouse } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DomainHubNav } from '../../components/domain/DomainHubNav';
import { kardexPath } from '../../lib/module-links';
import {
  formatQtyNumber,
  formatUnitSymbol,
  parseQtyInput,
  qtyInputStep,
  type UnitOfMeasureDto,
  validateQtyForUnit,
} from '../../lib/units-of-measure';

interface InventoryRow {
  id: string;
  productId: string;
  quantity: number;
  reservedQty: number;
  available: number;
  lowStock: boolean;
  product: {
    sku: string;
    name: string;
    minStock: number;
    maxStock: number;
    costPrice: string;
    category: { id: string; name: string } | null;
    unitSymbol?: string;
    unitName?: string;
    unitDecimalPlaces?: number;
    unitAllowsDecimals?: boolean;
  };
}

function productUnit(p: InventoryRow['product']): UnitOfMeasureDto | null {
  if (!p.unitSymbol) return null;
  return {
    id: '',
    code: '',
    name: p.unitName ?? p.unitSymbol,
    symbol: p.unitSymbol,
    category: '',
    categoryLabel: '',
    allowsDecimals: p.unitAllowsDecimals ?? (p.unitDecimalPlaces ?? 0) > 0,
    decimalPlaces: p.unitDecimalPlaces ?? 0,
  };
}

interface ListResponse {
  data: InventoryRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function InventoryPage() {
  const { hasPermission } = useAuthStore();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const canAdjust = hasPermission('inventory.adjust');
  const canView = hasPermission('inventory.view');

  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') ?? '');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [adjOpen, setAdjOpen] = useState(false);
  const [adjRow, setAdjRow] = useState<InventoryRow | null>(null);
  const [newQty, setNewQty] = useState('');
  const [reason, setReason] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjErr, setAdjErr] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, lowStockOnly]);

  const {
    data: listRes,
    isPending: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['inventory', 'list', page, debouncedSearch, lowStockOnly],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (lowStockOnly) params.set('lowStockOnly', 'true');
      return apiFetch<ListResponse>(`/inventory?${params.toString()}`);
    },
    enabled: canView,
  });

  const rows = listRes?.data ?? [];
  const meta = listRes?.meta ?? { total: 0, page: 1, limit: 50, totalPages: 1 };
  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const openAdjust = (row: InventoryRow) => {
    setAdjRow(row);
    setNewQty(String(row.quantity));
    setReason('');
    setAdjErr(null);
    setAdjOpen(true);
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjRow) return;
    const unit = productUnit(adjRow.product);
    const q = parseQtyInput(newQty, -1);
    if (q < 0) {
      setAdjErr('Cantidad inválida');
      return;
    }
    const unitErr = q > 0 ? validateQtyForUnit(q, unit, 'Cantidad') : null;
    if (unitErr) {
      setAdjErr(unitErr);
      return;
    }
    if (reason.trim().length < 3) {
      setAdjErr('Indique un motivo (mín. 3 caracteres)');
      return;
    }
    setAdjSaving(true);
    setAdjErr(null);
    try {
      await apiPost('/inventory/adjust', {
        productId: adjRow.productId,
        newQuantity: q,
        reason: reason.trim(),
      });
      setAdjOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
    } catch (err) {
      setAdjErr(err instanceof Error ? err.message : 'Error al ajustar');
    } finally {
      setAdjSaving(false);
    }
  };

  if (!canView) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No tiene permiso para ver inventario (<code className="text-xs">inventory.view</code>).
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Warehouse className="h-7 w-7 text-primary" />
          Inventario
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stock físico, reservado en carritos POS abiertos y disponible para venta.
        </p>
      </div>

      <DomainHubNav
        links={[
          { to: '/products', label: 'Productos', permission: 'products.view' },
          { to: '/kardex', label: 'Kardex', permission: 'kardex.view' },
          { to: '/purchases', label: 'Compras', permission: 'purchases.view' },
          { to: '/sales', label: 'Ventas', permission: 'sales.view' },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Buscar por nombre, SKU o código…"
          className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={lowStockOnly}
          onChange={(e) => setLowStockOnly(e.target.checked)}
          className="rounded border-input"
        />
        Solo bajo mínimo
      </label>
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
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Categoría</th>
                  <th className="text-right p-3 font-medium">Físico</th>
                  <th className="text-center p-3 font-medium hidden sm:table-cell">U.M.</th>
                  <th className="text-right p-3 font-medium hidden sm:table-cell">Reserv.</th>
                  <th className="text-right p-3 font-medium">Disponible</th>
                  <th className="text-center p-3 font-medium">Alerta</th>
                  {hasPermission('kardex.view') && (
                    <th className="text-right p-3 font-medium hidden md:table-cell">Kardex</th>
                  )}
                  {canAdjust && <th className="text-right p-3 font-medium">Ajuste</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        (canAdjust ? 1 : 0) + (hasPermission('kardex.view') ? 1 : 0) + 7
                      }
                      className="p-8 text-center text-muted-foreground"
                    >
                      Sin registros de inventario (¿migraciones y productos creados?).
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs">{r.product.sku}</td>
                      <td className="p-3 font-medium">{r.product.name}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">
                        {r.product.category?.name ?? '—'}
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium">
                        {formatQtyNumber(r.quantity, productUnit(r.product))}
                      </td>
                      <td className="p-3 text-center text-muted-foreground hidden sm:table-cell">
                        {formatUnitSymbol(productUnit(r.product))}
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {formatQtyNumber(r.reservedQty, productUnit(r.product))}
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium text-primary">
                        {formatQtyNumber(r.available, productUnit(r.product))}
                      </td>
                      <td className="p-3 text-center">
                        {r.lowStock ? (
                          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                            Bajo mínimo
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      {hasPermission('kardex.view') && (
                        <td className="p-3 text-right hidden md:table-cell">
                          <Link
                            to={kardexPath({ productId: r.productId })}
                            title="Kardex del producto"
                            className="inline-flex rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Link>
                        </td>
                      )}
                      {canAdjust && (
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => openAdjust(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-input px-2 py-1 text-xs hover:bg-accent"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Ajustar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
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

      {adjOpen && adjRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={submitAdjust}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">Ajustar inventario</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {adjRow.product.name}
              {adjRow.product.unitSymbol ? ` · ${adjRow.product.unitSymbol}` : ''}
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-muted-foreground">Nueva cantidad física</span>
                <input
                  aria-label="Nueva cantidad física"
                  type="number"
                  min={0}
                  step={qtyInputStep(productUnit(adjRow.product))}
                  required
                  className={cn(
                    'mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                  )}
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Motivo (auditoría)</span>
                <textarea
                  aria-label="Motivo"
                  required
                  minLength={3}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Conteo físico, rotura, corrección…"
                />
              </label>
              {adjErr && <p className="text-sm text-destructive">{adjErr}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjOpen(false)}
                  className="rounded-lg border border-input px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adjSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {adjSaving ? 'Guardando…' : 'Registrar ajuste'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
