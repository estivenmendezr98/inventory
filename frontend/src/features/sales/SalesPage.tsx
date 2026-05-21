import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, apiPost } from '../../lib/api';
import { SaleFormModal } from './SaleFormModal';
import { PAYMENT_METHOD_LABEL, SALE_STATUS_LABEL, saleStatusClass } from './saleStatus';
import { BookOpen, FileText, Plus, Receipt } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DomainHubNav } from '../../components/domain/DomainHubNav';
import { invoicesPath, kardexPath } from '../../lib/module-links';
import { PrintThermalTicketButton } from '../../components/printing/PrintThermalTicketButton';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

interface SaleListRow {
  id: string;
  number: string;
  total: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  customer: { id: string; name: string } | null;
  user: { id: string; name: string };
  lineCount: number;
}

interface ListResponse {
  data: SaleListRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface SaleDetail extends SaleListRow {
  updatedAt: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  user: { id: string; name: string; email: string };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: string;
    discount: string;
    taxRate: string;
    subtotal: string;
    product: { id: string; sku: string; name: string };
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: string;
    change: string;
    reference: string | null;
    createdAt: string;
  }>;
  invoice: { id: string; number: string; status: string; date: string } | null;
}

interface CustomerOpt {
  id: string;
  name: string;
  documentNumber: string;
}

export function SalesPage() {
  const { hasPermission } = useAuthStore();
  const [searchParams] = useSearchParams();
  const canView = hasPermission('sales.view');
  const canInvoice = hasPermission('invoices.create');
  const canCreate = hasPermission('sales.create');
  const canCancel = hasPermission('sales.cancel');
  const canRefund = hasPermission('sales.refund');

  const [rows, setRows] = useState<SaleListRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);

  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (customerFilter) params.set('customerId', customerFilter);
    if (search.trim()) params.set('search', search.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    try {
      const res = await apiFetch<ListResponse>(`/sales?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, customerFilter, search, from, to]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    void load();
  }, [canView, load]);

  useEffect(() => {
    if (!canView) return;
    apiFetch<{ data: CustomerOpt[] }>('/customers?limit=100')
      .then((r) => setCustomers(r.data))
      .catch(() => setCustomers([]));
  }, [canView]);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && canView) void openDetail(openId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    setActionErr(null);
    try {
      const d = await apiFetch<SaleDetail>(`/sales/${id}`);
      setDetail(d);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setDetailLoading(false);
    }
  };

  const postAction = async (path: string) => {
    if (!detailId) return;
    setActionErr(null);
    try {
      await apiPost(path, {});
      await load();
      await openDetail(detailId);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
    }
  };

  const canShowCancel =
    detail &&
    canCancel &&
    detail.status !== 'CANCELLED' &&
    detail.status !== 'REFUNDED' &&
    detail.status !== 'SUSPENDED';

  const canShowRefund = detail && canRefund && detail.status === 'COMPLETED';

  if (!canView) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        Sin permiso <code className="text-xs">sales.view</code>.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" />
            Ventas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ventas completadas descuentan inventario y registran kardex OUT. Anular o reembolsar
            restaura stock.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-muted-foreground">
          Estado
          <select
            className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[10rem]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="COMPLETED">Completada</option>
            <option value="SUSPENDED">Suspendida</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="REFUNDED">Reembolsada</option>
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Cliente
          <select
            className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[12rem]"
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.documentNumber} — {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted-foreground flex-1 min-w-[12rem] max-w-md">
          Buscar
          <input
            type="search"
            placeholder="Número o nombre de cliente"
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

      <DomainHubNav
        links={[
          { to: '/pos', label: 'POS', permission: 'pos.access' },
          { to: '/cash-register', label: 'Caja', permission: 'cash_register.open' },
          { to: '/invoices', label: 'Ticket / Comprobante local', permission: 'invoices.view' },
          { to: '/kardex', label: 'Kardex', permission: 'kardex.view' },
          { to: '/products', label: 'Productos', permission: 'products.view' },
        ]}
      />

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
                  <th className="text-left p-3 font-medium hidden md:table-cell">Cliente</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium">Líneas</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No hay ventas.
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
                        {new Date(r.createdAt).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {r.customer?.name ?? '—'}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {cop.format(Number(r.total))}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            saleStatusClass(r.status)
                          )}
                        >
                          {SALE_STATUS_LABEL[r.status] ?? r.status}
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

      <SaleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
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
                      {detail.customer
                        ? `${detail.customer.name}`
                        : 'Venta sin cliente (contado)'}
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
                          saleStatusClass(detail.status)
                        )}
                      >
                        {SALE_STATUS_LABEL[detail.status] ?? detail.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Por {detail.user.name}
                      </span>
                      {detail.paidAt && (
                        <span className="text-xs text-muted-foreground">
                          Pagado{' '}
                          {new Date(detail.paidAt).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <h3 className="text-sm font-medium">Productos</h3>
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
                              {it.quantity} × {cop.format(Number(it.unitPrice))} →{' '}
                              {cop.format(Number(it.subtotal))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <h3 className="text-sm font-medium">Pagos</h3>
                      <div className="rounded-lg border border-border divide-y divide-border">
                        {detail.payments.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"
                          >
                            <span>{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {cop.format(Number(p.amount))}
                              {Number(p.change) > 0 && (
                                <> (cambio {cop.format(Number(p.change))})</>
                              )}
                              {p.reference && (
                                <span className="ml-2 text-xs">Ref. {p.reference}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-4 text-sm tabular-nums">
                      <span>Subtotal: {cop.format(Number(detail.subtotal))}</span>
                      <span className="text-muted-foreground">|</span>
                      <span>Desc.: {cop.format(Number(detail.discountTotal))}</span>
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
                      {detail.invoice && hasPermission('invoices.view') && (
                        <>
                          <PrintThermalTicketButton
                            invoiceId={detail.invoice.id}
                            label="Imprimir ticket"
                            className="px-3 py-2 text-sm"
                          />
                          <Link
                            to={invoicesPath(detail.invoice.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent"
                          >
                            <FileText className="h-4 w-4" />
                            Comprobante {detail.invoice.number}
                          </Link>
                        </>
                      )}
                      {detail.status === 'COMPLETED' &&
                        !detail.invoice &&
                        canInvoice && (
                          <Link
                            to="/invoices"
                            className="inline-flex items-center gap-1 rounded-lg bg-primary/90 px-3 py-2 text-sm text-primary-foreground"
                          >
                            <FileText className="h-4 w-4" />
                            Generar comprobante
                          </Link>
                        )}
                      {['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(detail.status) &&
                        hasPermission('kardex.view') && (
                          <Link
                            to={kardexPath({
                              referenceType: 'Sale',
                              referenceId: detail.id,
                            })}
                            className="inline-flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent"
                          >
                            <BookOpen className="h-4 w-4" />
                            Movimientos kardex
                          </Link>
                        )}
                      {canShowCancel && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              !window.confirm(
                                detail.status === 'COMPLETED'
                                  ? '¿Anular venta? Se devolverá el stock al inventario.'
                                  : '¿Cancelar esta venta?'
                              )
                            )
                              return;
                            void postAction(`/sales/${detail.id}/cancel`);
                          }}
                          className="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive"
                        >
                          Anular venta
                        </button>
                      )}
                      {canShowRefund && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              !window.confirm(
                                '¿Marcar como reembolsada? Se devolverá el stock al inventario.'
                              )
                            )
                              return;
                            void postAction(`/sales/${detail.id}/refund`);
                          }}
                          className="rounded-lg bg-purple-600/90 px-3 py-2 text-sm text-white"
                        >
                          Reembolsar
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
