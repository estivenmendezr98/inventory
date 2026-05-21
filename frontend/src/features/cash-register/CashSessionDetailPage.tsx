import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { apiDelete, apiFetch, apiPatch } from '../../lib/api';
import { invoicesPath } from '../../lib/module-links';
import { PAYMENT_METHOD_LABEL } from '../sales/saleStatus';
import { ArrowLeft, DollarSign, FileText, Pencil, Wrench } from 'lucide-react';
import { SaleAdjustmentModal } from './SaleAdjustmentModal';
import { cn } from '../../lib/utils';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Sobra (+) o falta (−) en caja: `+ $ 5.000` / `- $ 5.000`. */
function formatSignedCop(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return cop.format(0);
  const abs = cop.format(Math.abs(n));
  return n > 0 ? `+ ${abs}` : `- ${abs}`;
}

const MOVEMENT_LABEL: Record<string, string> = {
  INCOME: 'Entrada',
  EXPENSE: 'Salida',
  SALE: 'Venta (efectivo)',
};

type TabId = 'resumen' | 'ventas' | 'productos' | 'clientes' | 'movimientos' | 'arqueo' | 'admin';

interface SessionReport {
  session: {
    id: string;
    cashRegisterName: string;
    userName: string;
    cashierEmail: string;
    openingAmount: string;
    closingAmount: string | null;
    expectedAmount: string | null;
    difference: string | null;
    expectedCashNow: string;
    openedAt: string;
    closedAt: string | null;
    status: string;
  };
  summary: {
    salesCount: number;
    salesTotal: string;
    grossProfit: string;
    marginPercent: number;
    estimatedCost: string;
    discountTotal: string;
    taxTotal: string;
    incomeManual: string;
    expenseTotal: string;
    cashSalesFromMovements: string;
    expectedCash: string;
    closingAmount: string | null;
    difference: string | null;
  };
  performance: { status: 'good' | 'warning' | 'alert'; notes: string[] };
  paymentsByMethod: Array<{ method: string; count: number; total: string }>;
  topProducts: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    name: string;
    documentNumber: string;
    salesCount: number;
    total: number;
  }>;
  sales: Array<{
    id: string;
    number: string;
    total: string;
    paidAt: string;
    seller: { id: string; name: string };
    customer: { id: string; name: string; documentNumber: string } | null;
    itemCount: number;
    payments: Array<{ method: string; amount: string; change: string; net: string }>;
    invoice: { id: string; fullNumber: string; status: string } | null;
  }>;
  movements: Array<{
    id: string;
    type: string;
    amount: string;
    description: string | null;
    createdAt: string;
    userName: string;
  }>;
}

function performanceBadge(status: string) {
  switch (status) {
    case 'good':
      return 'bg-green-500/15 text-green-600 dark:text-green-400';
    case 'warning':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    default:
      return 'bg-destructive/15 text-destructive';
  }
}

export function CashSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('cash_register.manage');
  const canAdjust = hasPermission('sales.adjust');
  const canInvoices = hasPermission('invoices.view');

  const [report, setReport] = useState<SessionReport | null>(null);
  const [tab, setTab] = useState<TabId>('resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [admOpening, setAdmOpening] = useState('');
  const [admClosing, setAdmClosing] = useState('');
  const [admExpected, setAdmExpected] = useState('');
  const [admDiff, setAdmDiff] = useState('');
  const [admStatus, setAdmStatus] = useState('OPEN');
  const [adjustSaleId, setAdjustSaleId] = useState<string | null>(null);

  const closeAdjustModal = useCallback(() => setAdjustSaleId(null), []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SessionReport>(`/cash-register/session-reports/${id}`);
      setReport(data);
      setAdmOpening(data.session.openingAmount);
      setAdmClosing(data.session.closingAmount ?? '');
      setAdmExpected(data.session.expectedAmount ?? data.summary.expectedCash);
      setAdmDiff(data.session.difference ?? '');
      setAdmStatus(data.session.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar informe');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const onAdjustSuccess = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id || !canAdjust) return;
    const adjustSale = searchParams.get('adjustSale')?.trim();
    if (!adjustSale) return;
    setAdjustSaleId(adjustSale);
    if (searchParams.get('tab') === 'ventas') setTab('ventas');
    const next = new URLSearchParams(searchParams);
    next.delete('adjustSale');
    next.delete('tab');
    setSearchParams(next, { replace: true });
  }, [id, canAdjust, searchParams, setSearchParams]);

  const saveSessionAdmin = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await apiPatch(`/cash-register/sessions/${id}`, {
        openingAmount: admOpening ? Number(admOpening) : undefined,
        closingAmount: admClosing !== '' ? Number(admClosing) : undefined,
        expectedAmount: admExpected !== '' ? Number(admExpected) : undefined,
        difference: admDiff !== '' ? Number(admDiff) : undefined,
        status: admStatus,
      });
      setAdminOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  const deleteMovement = async (movementId: string) => {
    if (!id || !window.confirm('¿Eliminar este movimiento?')) return;
    setBusy(true);
    try {
      await apiDelete(`/cash-register/sessions/${id}/movements/${movementId}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (!hasPermission('cash_register.open')) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Sin permiso <code className="text-xs">cash_register.open</code>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'ventas', label: 'Ventas' },
    { id: 'productos', label: 'Productos' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'movimientos', label: 'Movimientos' },
    { id: 'arqueo', label: 'Arqueo' },
    ...(canManage ? [{ id: 'admin' as TabId, label: 'Ajustes admin' }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/cash-register')}
          className="inline-flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a caja
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading || !report ? (
        <p className="text-sm text-muted-foreground">Cargando informe de sesión…</p>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="h-7 w-7 text-primary" />
                  {report.session.cashRegisterName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Cajero: <span className="font-medium text-foreground">{report.session.userName}</span>{' '}
                  · {report.session.cashierEmail}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Apertura: {new Date(report.session.openedAt).toLocaleString('es-CO')}
                  {report.session.closedAt && (
                    <>
                      {' '}
                      · Cierre: {new Date(report.session.closedAt).toLocaleString('es-CO')}
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    report.session.status === 'OPEN'
                      ? 'bg-green-500/15 text-green-500'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {report.session.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                </span>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    performanceBadge(report.performance.status)
                  )}
                >
                  {report.performance.status === 'good'
                    ? 'Turno saludable'
                    : report.performance.status === 'warning'
                      ? 'Revisar'
                      : 'Atención'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition',
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'resumen' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Ventas" value={String(report.summary.salesCount)} sub={cop.format(Number(report.summary.salesTotal))} />
              <StatCard
                label="Utilidad bruta"
                value={cop.format(Number(report.summary.grossProfit))}
                sub={`Margen ${report.summary.marginPercent} %`}
                positive={Number(report.summary.grossProfit) >= 0}
              />
              <StatCard label="Costo estimado" value={cop.format(Number(report.summary.estimatedCost))} />
              <StatCard
                label="Efectivo esperado"
                value={cop.format(Number(report.summary.expectedCash))}
                sub={
                  report.session.status === 'CLOSED' && report.summary.difference
                    ? `Dif. ${formatSignedCop(Number(report.summary.difference))}`
                    : undefined
                }
              />
              {report.performance.notes.map((n, i) => (
                <p key={i} className="sm:col-span-2 lg:col-span-4 text-sm text-muted-foreground rounded-lg border border-border px-3 py-2">
                  {n}
                </p>
              ))}
              <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium mb-3">Pagos por método</h3>
                <div className="flex flex-wrap gap-3">
                  {report.paymentsByMethod.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin ventas.</p>
                  ) : (
                    report.paymentsByMethod.map((p) => (
                      <div key={p.method} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">
                          {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                        </span>
                        <p className="font-semibold tabular-nums">{cop.format(Number(p.total))}</p>
                        <p className="text-xs text-muted-foreground">{p.count} pago(s)</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'ventas' && (
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left p-3">Hora</th>
                    <th className="text-left p-3">Venta</th>
                    <th className="text-left p-3">Vendedor</th>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Pago</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-center p-3">Factura</th>
                    {canAdjust && <th className="text-right p-3">Ajuste</th>}
                  </tr>
                </thead>
                <tbody>
                  {report.sales.length === 0 ? (
                    <tr>
                      <td colSpan={canAdjust ? 8 : 7} className="p-8 text-center text-muted-foreground">
                        Sin ventas en este turno.
                      </td>
                    </tr>
                  ) : (
                    report.sales.map((s) => (
                      <tr key={s.id} className="border-b border-border/60 hover:bg-muted/20">
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(s.paidAt).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-3 font-mono text-xs">{s.number}</td>
                        <td className="p-3">{s.seller.name}</td>
                        <td className="p-3 text-muted-foreground">
                          {s.customer ? `${s.customer.documentNumber} · ${s.customer.name}` : 'Contado'}
                        </td>
                        <td className="p-3 text-xs">
                          {s.payments.map((p) => PAYMENT_METHOD_LABEL[p.method] ?? p.method).join(', ')}
                        </td>
                        <td className="p-3 text-right font-medium tabular-nums">
                          {cop.format(Number(s.total))}
                        </td>
                        <td className="p-3 text-center">
                          {s.invoice && canInvoices ? (
                            <Link
                              to={invoicesPath(s.invoice.id)}
                              className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {s.invoice.fullNumber}
                            </Link>
                          ) : s.invoice ? (
                            <span className="text-xs">{s.invoice.fullNumber}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        {canAdjust && (
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdjustSaleId(s.id);
                              }}
                              className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs hover:bg-muted"
                            >
                              <Wrench className="h-3.5 w-3.5" />
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
          )}

          {tab === 'productos' && (
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left p-3">SKU</th>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-right p-3">Cant.</th>
                    <th className="text-right p-3">Ingresos</th>
                    <th className="text-right p-3">Costo</th>
                    <th className="text-right p-3">Utilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p) => (
                    <tr key={p.productId} className="border-b border-border/60">
                      <td className="p-3 font-mono text-xs">{p.sku}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right tabular-nums">{p.quantity}</td>
                      <td className="p-3 text-right tabular-nums">{cop.format(p.revenue)}</td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">
                        {cop.format(p.cost)}
                      </td>
                      <td
                        className={cn(
                          'p-3 text-right tabular-nums font-medium',
                          p.profit >= 0 ? 'text-green-600' : 'text-destructive'
                        )}
                      >
                        {cop.format(p.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'clientes' && (
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Documento</th>
                    <th className="text-right p-3">Compras</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topCustomers.map((c) => (
                    <tr key={c.customerId} className="border-b border-border/60">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-muted-foreground">{c.documentNumber}</td>
                      <td className="p-3 text-right">{c.salesCount}</td>
                      <td className="p-3 text-right font-medium tabular-nums">
                        {cop.format(c.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'movimientos' && (
            <div className="rounded-xl border border-border divide-y divide-border">
              {report.movements.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-xs font-medium',
                        m.type === 'EXPENSE'
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-green-500/15 text-green-500'
                      )}
                    >
                      {MOVEMENT_LABEL[m.type] ?? m.type}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString('es-CO')} · {m.userName}
                    </span>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{cop.format(Number(m.amount))}</span>
                    {canManage && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void deleteMovement(m.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'arqueo' && (
            <div className="rounded-xl border border-border p-6 space-y-4 max-w-lg">
              <Row label="Fondo inicial" value={cop.format(Number(report.session.openingAmount))} />
              <Row label="+ Entradas manuales" value={cop.format(Number(report.summary.incomeManual))} positive />
              <Row label="+ Ventas efectivo (mov.)" value={cop.format(Number(report.summary.cashSalesFromMovements))} positive />
              <Row label="− Salidas" value={cop.format(Number(report.summary.expenseTotal))} negative />
              <div className="border-t border-border pt-3">
                <Row label="= Efectivo esperado" value={cop.format(Number(report.summary.expectedCash))} bold />
              </div>
              {report.session.status === 'CLOSED' && (
                <>
                  <Row
                    label="Efectivo contado al cierre"
                    value={cop.format(Number(report.summary.closingAmount ?? 0))}
                    bold
                  />
                  <Row
                    label="Diferencia (sobra + / falta −)"
                    value={formatSignedCop(Number(report.summary.difference ?? 0))}
                    bold
                    positive={Number(report.summary.difference) > 0}
                    negative={Number(report.summary.difference) < 0}
                  />
                </>
              )}
            </div>
          )}

          {tab === 'admin' && canManage && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4 max-w-md">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Ajuste de sesión (super administrador)
              </h2>
              <p className="text-xs text-muted-foreground">
                Use solo para corregir arqueos o datos erróneos. Queda registrado en auditoría.
              </p>
              {!adminOpen ? (
                <button
                  type="button"
                  onClick={() => setAdminOpen(true)}
                  className="rounded-lg border border-input px-4 py-2 text-sm"
                >
                  Editar sesión
                </button>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs">
                    Fondo inicial
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                      value={admOpening}
                      onChange={(e) => setAdmOpening(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs">
                    Cierre contado
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                      value={admClosing}
                      onChange={(e) => setAdmClosing(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs">
                    Esperado sistema
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                      value={admExpected}
                      onChange={(e) => setAdmExpected(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs">
                    Diferencia
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                      value={admDiff}
                      onChange={(e) => setAdmDiff(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs">
                    Estado
                    <select
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                      value={admStatus}
                      onChange={(e) => setAdmStatus(e.target.value)}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveSessionAdmin()}
                      className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminOpen(false)}
                      className="rounded-lg border border-input px-4 py-2 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {adjustSaleId && report && (
        <SaleAdjustmentModal
          saleId={adjustSaleId}
          sessionId={id}
          sessionClosed={report.session.status === 'CLOSED'}
          onClose={closeAdjustModal}
          onSuccess={onAdjustSuccess}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-xl font-bold tabular-nums mt-1',
          positive === true && 'text-green-600',
          positive === false && 'text-destructive'
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  positive,
  negative,
  alert,
}: {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
  negative?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={cn(positive && 'text-green-600', negative && 'text-destructive')}>
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          bold && 'font-semibold',
          positive && 'text-green-600',
          negative && 'text-destructive',
          alert && !positive && !negative && 'text-amber-600 font-semibold'
        )}
      >
        {value}
      </span>
    </div>
  );
}
