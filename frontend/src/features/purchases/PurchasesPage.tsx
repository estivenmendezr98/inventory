import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { apiDelete, apiFetch, apiPatch } from '../../lib/api';
import { PurchaseFormModal } from './PurchaseFormModal';
import { PURCHASE_STATUS_LABEL, purchaseStatusClass } from './purchaseStatus';
import { BookOpen, Pencil, Plus, ShoppingCart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DomainHubNav } from '../../components/domain/DomainHubNav';
import { kardexPath, purchasesPath } from '../../lib/module-links';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

interface PurchaseListRow {
  id: string;
  number: string;
  date: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  status: string;
  notes: string | null;
  createdAt: string;
  supplier: { id: string; name: string; nit: string };
  user: { id: string; name: string };
  lineCount: number;
}

interface ListResponse {
  data: PurchaseListRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface PurchaseDetail extends PurchaseListRow {
  updatedAt: string;
  user: { id: string; name: string; email: string };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitCost: string;
    taxRate: string;
    subtotal: string;
    product: { id: string; sku: string; name: string };
  }>;
}

interface SupplierOpt {
  id: string;
  name: string;
  nit: string;
}

export function PurchasesPage() {
  const { hasPermission } = useAuthStore();
  const [searchParams] = useSearchParams();
  const canCreate = hasPermission('purchases.create');
  const canUpdate = hasPermission('purchases.update');
  const canDelete = hasPermission('purchases.delete');

  const [rows, setRows] = useState<PurchaseListRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? '');
  const [supplierFilter, setSupplierFilter] = useState(() => searchParams.get('supplierId') ?? '');
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [from, setFrom] = useState(() => searchParams.get('from') ?? '');
  const [to, setTo] = useState(() => searchParams.get('to') ?? '');
  const [page, setPage] = useState(1);
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);

  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (supplierFilter) params.set('supplierId', supplierFilter);
    if (search.trim()) params.set('search', search.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    try {
      const res = await apiFetch<ListResponse>(`/purchases?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar compras');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, supplierFilter, search, from, to]);

  useEffect(() => {
    apiFetch<{ data: SupplierOpt[] }>('/suppliers?limit=100')
      .then((r) => setSuppliers(r.data))
      .catch(() => setSuppliers([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) void openDetail(openId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    setActionErr(null);
    try {
      const d = await apiFetch<PurchaseDetail>(`/purchases/${id}`);
      setDetail(d);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setDetailLoading(false);
    }
  };

  const patchStatus = async (id: string, status: string) => {
    setActionErr(null);
    try {
      await apiPatch(`/purchases/${id}`, { status });
      await load();
      if (detailId === id) await openDetail(id);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
    }
  };

  const removeDraft = async (id: string) => {
    if (!window.confirm('¿Eliminar esta compra en borrador?')) return;
    setActionErr(null);
    try {
      await apiDelete(`/purchases/${id}`);
      setDetail(null);
      setDetailId(null);
      load();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Compras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Órdenes a proveedor; la recepción incrementa inventario y registra kardex IN.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setEditPurchaseId(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nueva compra
          </button>
        )}
      </div>

      <DomainHubNav
        links={[
          { to: '/suppliers', label: 'Proveedores', permission: 'suppliers.view' },
          { to: '/products', label: 'Productos', permission: 'products.view' },
          { to: '/kardex', label: 'Kardex', permission: 'kardex.view' },
          { to: '/inventory', label: 'Inventario', permission: 'inventory.view' },
        ]}
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-muted-foreground">
          Estado
          <select
            className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[9rem]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="ORDERED">Ordenada</option>
            <option value="RECEIVED">Recibida</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Proveedor
          <select
            className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[12rem]"
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nit} — {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted-foreground flex-1 min-w-[10rem] max-w-xs">
          Buscar
          <input
            type="search"
            placeholder="Número o proveedor"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Desde
          <input
            type="date"
            className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Hasta
          <input
            type="date"
            className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
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
                  <th className="text-left p-3 font-medium">Número</th>
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Proveedor</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium">Líneas</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No hay compras.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/60 cursor-pointer hover:bg-muted/20"
                      onClick={() => openDetail(r.id)}
                    >
                      <td className="p-3 font-mono text-xs font-medium">{r.number}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(r.date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="p-3 hidden md:table-cell">{r.supplier.name}</td>
                      <td className="p-3 text-right tabular-nums">
                        {cop.format(Number(r.total))}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            purchaseStatusClass(r.status)
                          )}
                        >
                          {PURCHASE_STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">{r.lineCount}</td>
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

      <PurchaseFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditPurchaseId(null);
        }}
        onSaved={load}
        purchaseId={editPurchaseId}
      />

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            {!detail && detailLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : !detail ? (
              <div className="py-6 text-center">
                {actionErr && <p className="text-sm text-destructive">{actionErr}</p>}
                <button
                  type="button"
                  onClick={() => {
                    setDetailId(null);
                    setActionErr(null);
                  }}
                  className="mt-4 rounded-lg border border-input px-3 py-1 text-sm"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold font-mono">{detail.number}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Link
                        to={purchasesPath({ supplierId: detail.supplier.id })}
                        className="text-primary hover:underline"
                      >
                        {detail.supplier.nit} — {detail.supplier.name}
                      </Link>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDetail(null);
                      setDetailId(null);
                    }}
                    className="rounded-lg border border-input px-3 py-1 text-sm"
                  >
                    Cerrar
                  </button>
                </div>

                {detailLoading ? (
                  <p className="mt-4 text-sm text-muted-foreground">Actualizando…</p>
                ) : (
                  <>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          purchaseStatusClass(detail.status)
                        )}
                      >
                        {PURCHASE_STATUS_LABEL[detail.status] ?? detail.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Creado por {detail.user.name}
                      </span>
                    </div>

                    {detail.notes && (
                      <p className="mt-3 text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                        {detail.notes}
                      </p>
                    )}

                    <div className="mt-4 space-y-2">
                      <h3 className="text-sm font-medium">Líneas</h3>
                      <div className="rounded-lg border border-border divide-y divide-border">
                        {detail.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"
                          >
                            <span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {it.product.sku}
                              </span>{' '}
                              {it.product.name}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {it.quantity} × {cop.format(Number(it.unitCost))} →{' '}
                              {cop.format(Number(it.subtotal))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-4 text-sm tabular-nums">
                      <span>Subtotal: {cop.format(Number(detail.subtotal))}</span>
                      <span className="text-muted-foreground">|</span>
                      <span>IVA: {cop.format(Number(detail.taxTotal))}</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="font-semibold">
                        Total: {cop.format(Number(detail.total))}
                      </span>
                    </div>

                    {actionErr && (
                      <p className="mt-3 text-sm text-destructive">{actionErr}</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {detail.status === 'RECEIVED' && hasPermission('kardex.view') && (
                        <Link
                          to={kardexPath({
                            referenceType: 'Purchase',
                            referenceId: detail.id,
                          })}
                          className="inline-flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent"
                        >
                          <BookOpen className="h-4 w-4" />
                          Movimientos kardex
                        </Link>
                      )}
                      {canUpdate && detail.status === 'DRAFT' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditPurchaseId(detail.id);
                              setFormOpen(true);
                              setDetail(null);
                              setDetailId(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => patchStatus(detail.id, 'ORDERED')}
                            className="rounded-lg bg-blue-600/90 px-3 py-2 text-sm text-white"
                          >
                            Emitir orden
                          </button>
                          <button
                            type="button"
                            onClick={() => patchStatus(detail.id, 'RECEIVED')}
                            className="rounded-lg bg-green-600/90 px-3 py-2 text-sm text-white"
                          >
                            Recibir (stock + kardex)
                          </button>
                          <button
                            type="button"
                            onClick={() => patchStatus(detail.id, 'CANCELLED')}
                            className="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {canUpdate && detail.status === 'ORDERED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => patchStatus(detail.id, 'RECEIVED')}
                            className="rounded-lg bg-green-600/90 px-3 py-2 text-sm text-white"
                          >
                            Recibir mercancía
                          </button>
                          <button
                            type="button"
                            onClick={() => patchStatus(detail.id, 'CANCELLED')}
                            className="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive"
                          >
                            Cancelar orden
                          </button>
                        </>
                      )}
                      {canDelete && detail.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => removeDraft(detail.id)}
                          className="rounded-lg bg-destructive/90 px-3 py-2 text-sm text-destructive-foreground"
                        >
                          Eliminar borrador
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
