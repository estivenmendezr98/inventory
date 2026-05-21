import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch, apiPost } from '../../lib/api';
import { ProductSelect } from '../../components/domain/ProductSelect';
import { AppAlertDialog } from '../../components/ui/app-alert-dialog';
import { invoicesPathForSaleAdjustment } from '../../lib/module-links';
import {
  INVOICE_ACTIVE_ADJUSTED_WARNING,
  INVOICE_ACTIVE_WARNING,
  INVOICE_CANCELLED_HINT,
  INVOICE_REACTIVATED_SUCCESS,
  mustCancelInvoiceBeforeAdjustment,
} from '../../lib/invoice-status';
import { useAuthStore } from '../../stores/auth.store';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

type SaleDetail = {
  id: string;
  number: string;
  total: string;
  status: string;
  invoice: { id: string; number: string; status: string } | null;
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
  payments: Array<{ method: string; amount: string; change: string }>;
};

type AdjustmentPreview = {
  valid: boolean;
  blockingError: string | null;
  totalBefore: string;
  totalAfter: string;
  totalDelta: number;
  requiresPayment: boolean;
  suggestedPayment: { method: string; amount: number; change?: number } | null;
  paymentError: string | null;
  cashDrawerDelta: number;
  lineCount: number;
  invoiceWarning: string | null;
  invoiceHint: string | null;
};

type PendingChange =
  | { action: 'REMOVE'; saleItemId: string; productId: string; quantity: number; label: string }
  | { action: 'ADD'; productId: string; quantity: number; unitPrice?: number; label: string };

interface SaleAdjustmentModalProps {
  saleId: string;
  sessionId: string;
  sessionClosed: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function formatSignedCop(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return cop.format(0);
  const abs = cop.format(Math.abs(n));
  return n > 0 ? `+ ${abs}` : `- ${abs}`;
}

function lineTotalWithTax(it: SaleDetail['items'][0]): number {
  return Math.round(
    it.quantity *
      (Number(it.unitPrice) - Number(it.discount)) *
      (1 + Number(it.taxRate) / 100),
  );
}

function SaleAdjustmentModalInner({
  saleId,
  sessionId,
  sessionClosed,
  onClose,
  onSuccess,
}: SaleAdjustmentModalProps) {
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState<PendingChange[]>([]);
  const [preview, setPreview] = useState<AdjustmentPreview | null>(null);
  const [previewFetching, setPreviewFetching] = useState(false);

  const [addProductId, setAddProductId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addPrice, setAddPrice] = useState<number | ''>('');

  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [payAmount, setPayAmount] = useState<number | ''>('');

  const [invoiceAlertOpen, setInvoiceAlertOpen] = useState(false);
  const [invoiceAlertTitle, setInvoiceAlertTitle] = useState('Factura activa');
  const [invoiceAlertMessage, setInvoiceAlertMessage] = useState(INVOICE_ACTIVE_WARNING);
  const [invoiceAlertVariant, setInvoiceAlertVariant] = useState<'warning' | 'info'>('warning');
  const [invoiceAlertInvoiceId, setInvoiceAlertInvoiceId] = useState<string | null>(null);
  const [afterApplyInvoiceAck, setAfterApplyInvoiceAck] = useState(false);

  const { hasPermission } = useAuthStore();
  const canOpenInvoices = hasPermission('invoices.view');

  const previewSeqRef = useRef(0);
  const invoiceWarnShownRef = useRef<string | null>(null);
  const paymentTouchedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      mountedRef.current = false;
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SaleDetail>(`/sales/${saleId}`);
      if (!mountedRef.current) return;
      setSale(data);
      paymentTouchedRef.current = false;
      const cash = data.payments.find((p) => p.method === 'CASH');
      if (cash) setPayMethod('CASH');
      else if (data.payments[0]) {
        setPayMethod(data.payments[0].method as 'CASH' | 'CARD' | 'TRANSFER');
      }
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'No se pudo cargar la venta');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    invoiceWarnShownRef.current = null;
    setInvoiceAlertOpen(false);
    setAfterApplyInvoiceAck(false);
  }, [saleId]);

  useEffect(() => {
    if (!sale?.invoice || !mustCancelInvoiceBeforeAdjustment(sale.invoice.status)) return;
    const msg =
      sale.invoice.status === 'ACTIVE_ADJUSTED'
        ? INVOICE_ACTIVE_ADJUSTED_WARNING
        : INVOICE_ACTIVE_WARNING;
    if (invoiceWarnShownRef.current === msg) return;
    invoiceWarnShownRef.current = msg;
    setInvoiceAlertMessage(msg);
    setInvoiceAlertOpen(true);
  }, [sale?.id, sale?.invoice?.status]);

  const showInvoiceAlert = useCallback(
    (
      message: string,
      opts?: { title?: string; variant?: 'warning' | 'info'; invoiceId?: string | null },
    ) => {
      setInvoiceAlertTitle(opts?.title ?? 'Factura activa');
      setInvoiceAlertVariant(opts?.variant ?? 'warning');
      setInvoiceAlertMessage(message);
      setInvoiceAlertInvoiceId(opts?.invoiceId ?? sale?.invoice?.id ?? null);
      setInvoiceAlertOpen(true);
    },
    [sale?.invoice?.id],
  );

  const dismissInvoiceAlert = useCallback(() => {
    setInvoiceAlertOpen(false);
    if (afterApplyInvoiceAck) {
      setAfterApplyInvoiceAck(false);
      onSuccess();
      onClose();
    }
  }, [afterApplyInvoiceAck, onClose, onSuccess]);

  const buildChangesPayload = useCallback(() => {
    return pending.map((p) => {
      if (p.action === 'REMOVE') {
        const line = sale?.items.find(
          (it) => it.productId === p.productId || it.id === p.saleItemId,
        );
        return {
          action: 'REMOVE' as const,
          productId: line?.productId ?? p.productId,
          quantity: p.quantity,
          ...(line?.id ? { saleItemId: line.id } : {}),
        };
      }
      return {
        action: 'ADD' as const,
        productId: p.productId,
        quantity: p.quantity,
        ...(p.unitPrice != null && p.unitPrice > 0 ? { unitPrice: p.unitPrice } : {}),
      };
    });
  }, [pending, sale]);

  useEffect(() => {
    if (pending.length === 0) {
      setPreview(null);
      setPreviewError(null);
      setPreviewFetching(false);
      return;
    }

    const seq = ++previewSeqRef.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        setPreviewFetching(true);
        try {
          const changes = buildChangesPayload();
          const data = await apiPost<AdjustmentPreview>(
            `/sales-adjustments/${saleId}/preview`,
            { changes },
          );
          if (!mountedRef.current || seq !== previewSeqRef.current) return;

          setPreview(data);
          if (data.invoiceWarning && data.invoiceWarning !== invoiceWarnShownRef.current) {
            invoiceWarnShownRef.current = data.invoiceWarning;
            showInvoiceAlert(data.invoiceWarning);
          }
          if (data.valid === false) {
            setPreviewError(data.blockingError ?? 'Ajuste no válido');
            return;
          }
          setPreviewError(null);

          if (data.requiresPayment && !paymentTouchedRef.current) {
            const suggested = data.suggestedPayment;
            if (suggested) {
              setPayMethod(suggested.method as 'CASH' | 'CARD' | 'TRANSFER');
              setPayAmount(suggested.amount);
            } else {
              setPayAmount(Math.abs(data.totalDelta));
            }
          } else if (!data.requiresPayment) {
            setPayAmount('');
            paymentTouchedRef.current = false;
          }
        } catch (e) {
          if (!mountedRef.current || seq !== previewSeqRef.current) return;
          setPreview(null);
          setPreviewError(e instanceof Error ? e.message : 'No se pudo calcular el ajuste');
        } finally {
          if (mountedRef.current && seq === previewSeqRef.current) {
            setPreviewFetching(false);
          }
        }
      })();
    }, 650);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pending, saleId, buildChangesPayload, showInvoiceAlert]);

  const addRemoveLine = (item: SaleDetail['items'][0], qty: number) => {
    setPending((prev) => {
      const existing = prev.find(
        (p): p is Extract<PendingChange, { action: 'REMOVE' }> =>
          p.action === 'REMOVE' && p.productId === item.productId,
      );
      const nextQty = Math.min((existing?.quantity ?? 0) + qty, item.quantity);
      const without = prev.filter(
        (p) => !(p.action === 'REMOVE' && p.productId === item.productId),
      );
      if (nextQty <= 0) return without;
      return [
        ...without,
        {
          action: 'REMOVE',
          saleItemId: item.id,
          productId: item.productId,
          quantity: nextQty,
          label: `Quitar ${nextQty}× ${item.product.sku}`,
        },
      ];
    });
  };

  const queueAdd = async () => {
    if (!addProductId || addQty < 1) return;
    let unitPrice: number | undefined;
    if (addPrice !== '') {
      unitPrice = addPrice;
    } else {
      try {
        const p = await apiFetch<{ salePrice: string }>(`/products/${addProductId}`);
        unitPrice = Number(p.salePrice);
      } catch {
        setError('No se pudo obtener el precio del producto');
        return;
      }
    }
    setPending((prev) => [
      ...prev,
      {
        action: 'ADD',
        productId: addProductId,
        quantity: addQty,
        unitPrice,
        label: `Agregar ${addQty}× producto`,
      },
    ]);
    setAddProductId('');
    setAddQty(1);
    setAddPrice('');
  };

  const submit = async () => {
    if (!sale || !reason.trim()) {
      setError('Indique el motivo del ajuste');
      return;
    }
    if (pending.length === 0) {
      setError('Agregue al menos un cambio');
      return;
    }
    if (preview?.valid === false || previewError) {
      setError(previewError ?? preview?.blockingError ?? 'Complete el ajuste antes de aplicar');
      return;
    }
    if (preview?.requiresPayment && (payAmount === '' || Number(payAmount) <= 0)) {
      setError('Indique el monto del cobro o devolución');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const freshSale = await apiFetch<SaleDetail>(`/sales/${saleId}`);
      const changes = pending.map((p) => {
        if (p.action === 'REMOVE') {
          const line = freshSale.items.find(
            (it) => it.productId === p.productId || it.id === p.saleItemId,
          );
          return {
            action: 'REMOVE' as const,
            productId: line?.productId ?? p.productId,
            quantity: p.quantity,
            ...(line?.id ? { saleItemId: line.id } : {}),
          };
        }
        return {
          action: 'ADD' as const,
          productId: p.productId,
          quantity: p.quantity,
          ...(p.unitPrice != null && p.unitPrice > 0 ? { unitPrice: p.unitPrice } : {}),
        };
      });

      const body: Record<string, unknown> = { reason: reason.trim(), changes };

      if (preview?.requiresPayment) {
        body.paymentDelta = {
          method: payMethod,
          amount: Number(payAmount),
          change: 0,
        };
      }

      const res = await apiPost<{
        invoiceSync?: { id: string; status: string; fullNumber: string } | null;
      }>(`/sales-adjustments/${saleId}`, body);

      if (res.invoiceSync) {
        setAfterApplyInvoiceAck(true);
        showInvoiceAlert(
          `${INVOICE_REACTIVATED_SUCCESS}\n\nFactura ${res.invoiceSync.fullNumber}.`,
          {
            title: 'Factura actualizada',
            variant: 'info',
            invoiceId: res.invoiceSync.id,
          },
        );
        return;
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al aplicar ajuste');
    } finally {
      setBusy(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-sale-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sticky top-0 bg-card z-10">
          <h2 id="adjust-sale-title" className="text-lg font-semibold">
            Ajustar venta {sale?.number ?? ''}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-muted"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!sessionClosed && (
            <p className="text-xs text-amber-600 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              La sesión sigue abierta; el ajuste actualiza inventario y pagos. Si hay efectivo en
              caja, se registrará al aplicar el ajuste.
            </p>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando venta…</p>
          ) : sale ? (
            <>
              {mustCancelInvoiceBeforeAdjustment(sale.invoice?.status) && (
                <button
                  type="button"
                  onClick={() =>
                    showInvoiceAlert(
                      preview?.invoiceWarning ??
                        (sale.invoice?.status === 'ACTIVE_ADJUSTED'
                          ? INVOICE_ACTIVE_ADJUSTED_WARNING
                          : INVOICE_ACTIVE_WARNING),
                    )
                  }
                  className="w-full text-left text-xs text-amber-700 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 hover:bg-amber-500/15"
                >
                  {sale.invoice?.status === 'ACTIVE_ADJUSTED'
                    ? 'Comprobante activo (ajustado) — anúlelo en Ticket / Comprobante antes de otro ajuste'
                    : 'Comprobante activo — anúlelo en Ticket / Comprobante antes de aplicar el ajuste'}
                </button>
              )}
              {sale.invoice?.status === 'CANCELLED' && (
                <p className="text-xs text-primary rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  {preview?.invoiceHint ?? INVOICE_CANCELLED_HINT}
                </p>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Líneas actuales</p>
                <ul className="space-y-2">
                  {sale.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span>
                        {it.product.sku} — {it.product.name}{' '}
                        <span className="text-muted-foreground">×{it.quantity}</span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {cop.format(lineTotalWithTax(it))}
                        </span>
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          className="rounded border border-input px-2 py-1 text-xs hover:bg-muted"
                          onClick={() => addRemoveLine(it, 1)}
                        >
                          −1
                        </button>
                        {it.quantity > 1 && (
                          <button
                            type="button"
                            className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => addRemoveLine(it, it.quantity)}
                          >
                            Quitar línea
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-medium">Agregar producto</p>
                <ProductSelect
                  value={addProductId}
                  onChange={setAddProductId}
                  placeholder="Buscar producto…"
                  allowClear={false}
                />
                <div className="flex gap-2">
                  <label className="text-xs flex-1">
                    Cant.
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      value={addQty}
                      onChange={(e) => setAddQty(Number(e.target.value) || 1)}
                    />
                  </label>
                  <label className="text-xs flex-1">
                    Precio (opc.)
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      value={addPrice}
                      onChange={(e) =>
                        setAddPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="Precio lista"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void queueAdd()}
                  disabled={!addProductId}
                  className="text-xs rounded-lg border border-input px-3 py-1.5 hover:bg-muted disabled:opacity-50"
                >
                  Añadir a cambios
                </button>
              </div>

              {pending.length > 0 && (
                <ul className="text-xs space-y-1 rounded-lg bg-muted/40 p-3">
                  {pending.map((p, i) => (
                    <li key={`${p.action}-${p.productId}-${i}`} className="flex justify-between gap-2">
                      <span>{p.label}</span>
                      <button
                        type="button"
                        className="text-destructive hover:underline shrink-0"
                        onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {pending.length > 0 && (
                <div className="relative rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1 min-h-[4.5rem]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">Resumen (servidor)</p>
                    {previewFetching && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                        Actualizando
                      </span>
                    )}
                  </div>
                  {previewError ? (
                    <p className="text-sm text-destructive">{previewError}</p>
                  ) : preview?.valid === false ? (
                    <p className="text-sm text-destructive">{preview.blockingError}</p>
                  ) : preview ? (
                    <div className={cn(previewFetching && 'opacity-70')}>
                      <p className="text-sm tabular-nums">
                        Total actual: {cop.format(Number(preview.totalBefore))} →{' '}
                        {cop.format(Number(preview.totalAfter))}
                      </p>
                      <p
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          preview.totalDelta > 0 && 'text-green-600',
                          preview.totalDelta < 0 && 'text-destructive',
                        )}
                      >
                        Diferencia: {formatSignedCop(preview.totalDelta)}
                      </p>
                      {sessionClosed && preview.cashDrawerDelta !== 0 && (
                        <p className="text-xs text-muted-foreground">
                          Efectivo en caja: {formatSignedCop(preview.cashDrawerDelta)}
                        </p>
                      )}
                      {!preview.requiresPayment && (
                        <p className="text-xs text-muted-foreground">
                          Sin cambio de total: no requiere cobro ni devolución.
                        </p>
                      )}
                      {preview.paymentError && (
                        <p className="text-xs text-amber-600 mt-1">{preview.paymentError}</p>
                      )}
                    </div>
                  ) : !previewFetching ? (
                    <p className="text-sm text-muted-foreground">Espere el cálculo…</p>
                  ) : null}
                </div>
              )}

              {preview?.requiresPayment && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-sm font-medium">
                    {preview.totalDelta > 0 ? 'Cobro adicional' : 'Devolución al cliente'}
                  </p>
                  <label className="block text-xs">
                    Método
                    <select
                      className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      value={payMethod}
                      onChange={(e) => {
                        paymentTouchedRef.current = true;
                        setPayMethod(e.target.value as typeof payMethod);
                      }}
                    >
                      <option value="CASH">Efectivo</option>
                      <option value="CARD">Tarjeta</option>
                      <option value="TRANSFER">Transferencia</option>
                    </select>
                  </label>
                  <label className="block text-xs">
                    Monto (debe ser {cop.format(Math.abs(preview.totalDelta))})
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      value={payAmount}
                      onChange={(e) => {
                        paymentTouchedRef.current = true;
                        setPayAmount(e.target.value === '' ? '' : Number(e.target.value));
                      }}
                    />
                  </label>
                </div>
              )}

              <label htmlFor="adjust-sale-reason" className="block text-xs">
                Motivo (obligatorio)
                <textarea
                  id="adjust-sale-reason"
                  className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm min-h-[72px]"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  placeholder="Ej. cliente cambió talla, error de digitación…"
                />
              </label>
            </>
          ) : null}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-card pb-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={
                busy ||
                loading ||
                !sale ||
                !!previewError ||
                preview?.valid === false ||
                mustCancelInvoiceBeforeAdjustment(sale.invoice?.status)
              }
              onClick={() => void submit()}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              {busy ? 'Aplicando…' : 'Aplicar ajuste'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modal, document.body)}
      <AppAlertDialog
        open={invoiceAlertOpen}
        title={invoiceAlertTitle}
        description={invoiceAlertMessage}
        onClose={dismissInvoiceAlert}
        confirmLabel={afterApplyInvoiceAck ? 'Entendido, cerrar' : 'Entendido'}
        invoiceId={canOpenInvoices ? invoiceAlertInvoiceId : null}
        invoicesLinkTo={
          canOpenInvoices && invoiceAlertInvoiceId && sessionId
            ? invoicesPathForSaleAdjustment({
                invoiceId: invoiceAlertInvoiceId,
                sessionId,
                saleId,
              })
            : null
        }
        variant={invoiceAlertVariant}
      />
    </>
  );
}

export const SaleAdjustmentModal = memo(SaleAdjustmentModalInner);
