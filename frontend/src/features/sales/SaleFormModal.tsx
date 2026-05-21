import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, apiPost } from '../../lib/api';
import { useCashSession } from '../../hooks/useCashSession';
import { Plus, Trash2 } from 'lucide-react';
import { PAYMENT_METHOD_LABEL } from './saleStatus';
import { cop, parseCopInput, roundCop } from '../../lib/money';
import {
  getRemainingDue,
  paymentNet,
  resolveSalePayments,
} from '../../lib/sale-payments';
import { cn } from '../../lib/utils';

interface ProductOpt {
  id: string;
  sku: string;
  name: string;
  salePrice: string;
  taxRate: string;
  stock: number;
}

interface CustomerOpt {
  id: string;
  name: string;
  documentNumber: string;
}

export interface SaleLineForm {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface SalePaymentForm {
  method: string;
  amount: number;
  change: number;
  reference: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function computeTotals(lines: SaleLineForm[]) {
  let sub = 0;
  let tax = 0;
  for (const l of lines) {
    if (!l.productId) continue;
    const unitPrice = roundCop(l.unitPrice);
    const disc = roundCop(l.discount || 0);
    const base = roundCop(l.quantity * (unitPrice - disc));
    sub += base;
    tax += roundCop(base * ((l.taxRate || 0) / 100));
  }
  return roundCop(sub + tax);
}

export function SaleFormModal({ open, onClose, onSaved }: Props) {
  const { data: cashSession, isPending: cashLoading } = useCashSession();
  const cashOpen = cashSession?.status === 'OPEN';

  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<SaleLineForm[]>([
    { productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 },
  ]);
  const [payments, setPayments] = useState<SalePaymentForm[]>([
    { method: 'CASH', amount: 0, change: 0, reference: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => computeTotals(lines), [lines]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    apiFetch<{ data: ProductOpt[] }>('/products?limit=200')
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]));
    apiFetch<{ data: CustomerOpt[] }>('/customers?limit=200')
      .then((r) => setCustomers(r.data))
      .catch(() => setCustomers([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLines([{ productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }]);
    setCustomerId('');
    setPayments([{ method: 'CASH', amount: 0, change: 0, reference: '' }]);
  }, [open]);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const lineDefaultsFromProduct = (productId: string): Partial<SaleLineForm> => {
    const p = productById.get(productId);
    if (!p) return { productId, unitPrice: 0, taxRate: 0 };
    return {
      productId,
      unitPrice: roundCop(Number(p.salePrice) || 0),
      taxRate: Number(p.taxRate) || 0,
    };
  };

  const updateLine = (idx: number, patch: Partial<SaleLineForm>) => {
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const onProductChange = (idx: number, productId: string) => {
    updateLine(idx, lineDefaultsFromProduct(productId));
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 },
    ]);
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, patch: Partial<SalePaymentForm>) => {
    setPayments((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const onPaymentMethodChange = (idx: number, method: string) => {
    setPayments((prev) => {
      const remaining = getRemainingDue(prev, total, idx);
      if (method === 'CASH') {
        return prev.map((row, i) =>
          i === idx ? { ...row, method, amount: 0, change: 0, reference: '' } : row
        );
      }
      const amount = prev.length === 1 ? total : remaining;
      return prev.map((row, i) =>
        i === idx ? { ...row, method, amount, change: 0, reference: '' } : row
      );
    });
  };

  const addPayment = () => {
    setPayments((prev) => [...prev, { method: 'CASH', amount: 0, change: 0, reference: '' }]);
  };

  const removePayment = (idx: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  };

  const lineCount = useMemo(() => lines.filter((l) => l.productId).length, [lines]);
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const resolvedPayments = useMemo(
    () => resolveSalePayments(payments, total, selectedCustomer, lineCount),
    [payments, total, selectedCustomer, lineCount]
  );

  const paidNet = resolvedPayments.reduce((s, p) => s + paymentNet(p), 0);
  const paymentsBalanced = paidNet === total && total > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLines = lines.filter((l) => l.productId);
    if (cleanLines.length === 0) {
      setError('Agregue al menos un producto');
      return;
    }
    if (paidNet !== total) {
      setError(`El neto de pagos (${cop.format(paidNet)}) debe igualar el total (${cop.format(total)})`);
      return;
    }
    for (let i = 0; i < resolvedPayments.length; i++) {
      const p = resolvedPayments[i];
      if (p.method === 'CASH') {
        const remaining = getRemainingDue(resolvedPayments, total, i);
        if (p.amount < remaining) {
          setError(`Efectivo insuficiente: faltan ${cop.format(remaining - p.amount)}`);
          return;
        }
      }
    }
    setSaving(true);
    setError(null);
    try {
      await apiPost('/sales', {
        customerId: customerId || undefined,
        items: cleanLines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitPrice: roundCop(Number(l.unitPrice)),
          discount: roundCop(Number(l.discount || 0)),
          taxRate: Number(l.taxRate || 0),
        })),
        payments: resolvedPayments.map((p) => ({
          method: p.method,
          amount: roundCop(Number(p.amount)),
          change: roundCop(Number(p.change || 0)),
          reference: p.reference.trim() || undefined,
        })),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar venta');
    } finally {
      setSaving(false);
    }
  };

  const lineSubtotal = (l: SaleLineForm) => {
    if (!l.productId) return 0;
    const unitPrice = roundCop(l.unitPrice);
    const disc = roundCop(l.discount || 0);
    const base = roundCop(l.quantity * (unitPrice - disc));
    return roundCop(base + base * ((l.taxRate || 0) / 100));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Nueva venta</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Requiere caja abierta. Registra venta completada, descuenta stock y genera kardex OUT.
        </p>

        {!cashLoading && !cashOpen && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
          >
            <p className="font-medium text-amber-800 dark:text-amber-200">Caja cerrada</p>
            <p className="text-muted-foreground mt-1">
              Abra un turno en{' '}
              <Link to="/cash-register" className="text-primary underline">
                Caja
              </Link>{' '}
              antes de registrar ventas.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block text-sm max-w-md">
            <span className="text-muted-foreground">Cliente (opcional)</span>
            <select
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">— Contado / sin cliente —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.documentNumber} — {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Productos</span>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 rounded-lg border border-input px-2 py-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Línea
            </button>
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid gap-2 sm:grid-cols-12 sm:items-end border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <label className="sm:col-span-4 text-xs">
                  Producto
                  <select
                    className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    value={line.productId}
                    onChange={(e) => onProductChange(idx, e.target.value)}
                  >
                    <option value="">—</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} · {cop.format(Number(p.salePrice))}
                        {p.stock >= 0 ? ` · stock ${p.stock}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2 text-xs">
                  Cant.
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(idx, { quantity: parseInt(e.target.value, 10) || 1 })
                    }
                  />
                </label>
                <label className="sm:col-span-2 text-xs">
                  P. venta
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    value={line.unitPrice || ''}
                    onChange={(e) =>
                      updateLine(idx, { unitPrice: parseCopInput(e.target.value) })
                    }
                  />
                </label>
                <label className="sm:col-span-1 text-xs">
                  Desc.
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    value={line.discount || ''}
                    onChange={(e) =>
                      updateLine(idx, { discount: parseCopInput(e.target.value) })
                    }
                  />
                </label>
                <label className="sm:col-span-2 text-xs">
                  IVA %
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    value={line.taxRate}
                    onChange={(e) =>
                      updateLine(idx, { taxRate: Number(e.target.value) || 0 })
                    }
                  />
                </label>
                <div className="sm:col-span-12 flex items-center justify-between gap-2">
                  {line.productId ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Subtotal línea: {cop.format(lineSubtotal(line))}
                    </span>
                  ) : (
                    <span />
                  )}
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="rounded p-2 text-muted-foreground hover:bg-destructive/10"
                      title="Quitar línea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted/40 px-4 py-3 text-right text-sm">
            <span className="text-muted-foreground">Total a cobrar: </span>
            <span className="text-lg font-semibold tabular-nums">{cop.format(total)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pagos</span>
            <button
              type="button"
              onClick={addPayment}
              className="text-xs rounded border border-input px-2 py-1"
            >
              + Pago
            </button>
          </div>
          <div className="space-y-2 rounded-lg border border-border p-3">
            {payments.map((p, idx) => {
              const row = resolvedPayments[idx] ?? p;
              const isCash = p.method === 'CASH';
              const remaining = getRemainingDue(resolvedPayments, total, idx);
              const net = paymentNet(row);
              const cashInsufficient = isCash && p.amount > 0 && p.amount < remaining;
              return (
              <div key={idx} className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                <div className="grid gap-2 sm:grid-cols-12 sm:items-end">
                <label className="sm:col-span-3 text-xs">
                  Método
                  <select
                    className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    value={p.method}
                    onChange={(e) => onPaymentMethodChange(idx, e.target.value)}
                  >
                    {Object.entries(PAYMENT_METHOD_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-3 text-xs">
                  {isCash ? 'Efectivo recibido' : 'Monto del pago'}
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={isCash ? `Mín. ${cop.format(remaining)}` : undefined}
                    className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    value={
                      (isCash ? p.amount : row.amount) === 0
                        ? ''
                        : String(isCash ? p.amount : row.amount)
                    }
                    onChange={(e) =>
                      updatePayment(idx, { amount: parseCopInput(e.target.value) })
                    }
                    readOnly={!isCash && payments.length === 1}
                  />
                </label>
                {isCash ? (
                  <label className="sm:col-span-2 text-xs">
                    Cambio (auto)
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      className="mt-1 w-full rounded border border-input bg-muted/50 px-2 py-1.5 text-sm font-medium text-primary"
                      value={row.change > 0 ? cop.format(row.change) : '—'}
                    />
                  </label>
                ) : (
                  <div className="sm:col-span-2 hidden sm:block" aria-hidden />
                )}
                <label className={cn('text-xs', isCash ? 'sm:col-span-3' : 'sm:col-span-5')}>
                  Referencia (automática)
                  <textarea
                    readOnly
                    rows={2}
                    className="mt-1 w-full rounded border border-input bg-muted/40 px-2 py-1.5 text-xs leading-snug"
                    value={row.reference}
                  />
                </label>
                {payments.length > 1 && (
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removePayment(idx)}
                      className="rounded p-2 text-muted-foreground hover:bg-destructive/10"
                      title="Quitar pago"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">
                    Aplica a esta venta:{' '}
                    <span className="font-medium tabular-nums text-foreground">
                      {cop.format(remaining)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'tabular-nums',
                      net === remaining && remaining > 0
                        ? 'text-green-600 font-medium'
                        : 'text-muted-foreground'
                    )}
                  >
                    Neto línea: {cop.format(net)}
                  </span>
                  {cashInsufficient && (
                    <span className="text-destructive">
                      Faltan {cop.format(remaining - p.amount)}
                    </span>
                  )}
                </div>
              </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 border-t border-border/60 text-sm">
              <span className="text-muted-foreground">Neto pagos</span>
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  paymentsBalanced ? 'text-green-600' : 'text-destructive'
                )}
              >
                {cop.format(paidNet)} / {cop.format(total)}
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                !cashOpen ||
                cashLoading ||
                !paymentsBalanced ||
                resolvedPayments.some((p) => p.amount <= 0)
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Registrar venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
