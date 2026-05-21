import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, apiPost, apiPut, apiDownloadBlob } from '../../lib/api';
import { FileText, Mail, Plus, X } from 'lucide-react';
import { InvoiceBillingSettings } from './InvoiceBillingSettings';
import { AppConfirmDialog } from '../../components/ui/app-confirm-dialog';
import { PAYMENT_METHOD_LABEL } from '../sales/saleStatus';
import { cn } from '../../lib/utils';
import { cashSessionSaleAdjustPath, parseSaleAdjustReturn } from '../../lib/module-links';
import { roundCop } from '../../lib/money';
import { INVOICE_STATUS_LABEL, invoiceStatusClass, isInvoiceOperational } from '../../lib/invoice-status';
import { PrintThermalTicketButton } from '../../components/printing/PrintThermalTicketButton';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

interface InvoiceRow {
  id: string;
  fullNumber: string;
  date: string;
  total: string;
  status: string;
  customerName: string | null;
  saleNumber: string;
}

interface ListResponse {
  data: InvoiceRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface EligibleSale {
  id: string;
  number: string;
  total: string;
  createdAt: string;
  customer: { id: string; name: string; documentNumber: string } | null;
}

interface InvoicePayment {
  id: string;
  method: string;
  amount: string;
  change: string;
  reference: string | null;
}

interface InvoiceDetail {
  id: string;
  fullNumber: string;
  resolutionNumber: string;
  date: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  status: string;
  customerName: string | null;
  customerDoc: string | null;
  pdfUrl: string | null;
  payments: InvoicePayment[];
  sale: {
    id: string;
    number: string;
    items: Array<{
      id: string;
      quantity: number;
      subtotal: string;
      product: { sku: string; name: string };
    }>;
  };
}

interface NumberingRow {
  id: string;
  prefix: string;
  resolutionNumber: string;
  startNumber: number;
  endNumber: number;
  currentNumber: number;
  endDate: string;
  isActive: boolean;
}

export function InvoicesPage() {
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const saleAdjustReturn = parseSaleAdjustReturn(searchParams);
  const canView = hasPermission('invoices.view');
  const canCreate = hasPermission('invoices.generate') || hasPermission('invoices.create');
  const canCancel = hasPermission('invoices.cancel');
  const canConfig = hasPermission('invoices.config');

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const [genOpen, setGenOpen] = useState(false);
  const [eligible, setEligible] = useState<EligibleSale[]>([]);
  const [pendingInvoiceCount, setPendingInvoiceCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const [numbering, setNumbering] = useState<NumberingRow[]>([]);
  const [numEdit, setNumEdit] = useState<Record<string, string>>({});
  const [prefixEdit, setPrefixEdit] = useState<Record<string, string>>({});
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search.trim()) params.set('search', search.trim());
    try {
      const res = await apiFetch<ListResponse>(`/invoices?${params}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadPendingCount = useCallback(async () => {
    if (!canCreate) return;
    try {
      const r = await apiFetch<{ data: EligibleSale[] }>('/invoices/eligible-sales');
      setPendingInvoiceCount(r.data.length);
    } catch {
      setPendingInvoiceCount(0);
    }
  }, [canCreate]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    load();
    void loadPendingCount();
  }, [canView, load, loadPendingCount]);

  const loadNumbering = useCallback(async () => {
    if (!canConfig) return;
    try {
      const r = await apiFetch<{ data: NumberingRow[] }>('/invoices/numbering');
      setNumbering(r.data);
    } catch {
      setNumbering([]);
    }
  }, [canConfig]);

  useEffect(() => {
    loadNumbering();
  }, [loadNumbering]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setActionErr(null);
    setDetailLoading(true);
    try {
      const d = await apiFetch<InvoiceDetail>(`/invoices/${id}`);
      setDetail(d);
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && canView) void openDetail(openId);
  }, [searchParams, canView]);

  const openGenerate = async () => {
    setBusy(true);
    setActionErr(null);
    try {
      const r = await apiFetch<{ data: EligibleSale[] }>('/invoices/eligible-sales');
      setEligible(r.data);
      setGenOpen(true);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const generateFromSale = async (saleId: string) => {
    setBusy(true);
    setActionErr(null);
    try {
      await apiPost<InvoiceDetail>(`/invoices/from-sale/${saleId}`, {});
      setGenOpen(false);
      await load();
      await loadPendingCount();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const confirmCancelInvoice = async () => {
    if (!detail) return;
    setBusy(true);
    setActionErr(null);
    try {
      await apiPost(`/invoices/${detail.id}/cancel`, {});
      setCancelConfirmOpen(false);
      const ret = parseSaleAdjustReturn(searchParams);
      if (ret) {
        navigate(cashSessionSaleAdjustPath(ret.sessionId, ret.adjustSale));
        return;
      }
      setDetail(null);
      setDetailId(null);
      await load();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error al anular');
    } finally {
      setBusy(false);
    }
  };

  const regenerateInvoiceFiles = async () => {
    if (!detail) return;
    if (!window.confirm('¿Regenerar el PDF del comprobante con la plantilla actual?')) return;
    setBusy(true);
    setActionErr(null);
    try {
      const updated = await apiPost<InvoiceDetail>(`/invoices/${detail.id}/regenerate-artifacts`, {});
      setDetail(updated);
      await load();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error al regenerar');
    } finally {
      setBusy(false);
    }
  };

  const downloadInvoiceFile = useCallback(async () => {
      if (!detail) return;
      setActionErr(null);
      try {
        const blob = await apiDownloadBlob(`/invoices/${detail.id}/files/pdf?t=${Date.now()}`);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${detail.fullNumber.replace(/[^\w.-]+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : 'Error al descargar');
      }
    }, [detail]);

  const saveNumbering = async (row: NumberingRow) => {
    const note = numEdit[row.id]?.trim();
    const prefix = prefixEdit[row.id]?.trim().toUpperCase();
    if (!note && !prefix) return;
    setBusy(true);
    setActionErr(null);
    try {
      await apiPut(`/invoices/numbering/${row.id}`, {
        ...(note ? { resolutionNumber: note } : {}),
        ...(prefix ? { prefix } : {}),
      });
      setNumEdit((m) => ({ ...m, [row.id]: '' }));
      setPrefixEdit((m) => ({ ...m, [row.id]: '' }));
      await loadNumbering();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const sendInvoiceEmail = async () => {
    if (!detail || !emailTo.trim()) return;
    setBusy(true);
    setActionErr(null);
    try {
      const r = await apiPost<{ message: string }>(`/invoices/${detail.id}/send-email`, {
        to: emailTo.trim(),
        ...(emailSubject.trim() ? { subject: emailSubject.trim() } : {}),
        ...(emailBody.trim() ? { body: emailBody.trim() } : {}),
      });
      setActionErr(null);
      window.alert(r.message);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Error al enviar correo');
    } finally {
      setBusy(false);
    }
  };

  if (!canView) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        Sin permiso <code className="text-xs">invoices.view</code>.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Ticket / Comprobante local
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprobantes de venta locales (TKT, etc.). Al cobrar en POS o ventas se genera el ticket automáticamente.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void openGenerate()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Generar desde venta
          </button>
        )}
      </div>

      {canCreate && pendingInvoiceCount > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
          <p>
            Hay <strong>{pendingInvoiceCount}</strong> venta{pendingInvoiceCount === 1 ? '' : 's'} completada
            {pendingInvoiceCount === 1 ? '' : 's'} sin comprobante (anteriores al cobro automático).
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void openGenerate()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Generar pendientes
          </button>
        </div>
      )}

      {canConfig && (
        <>
          <InvoiceBillingSettings />
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          {numbering.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Numeración local</h2>
              <p className="text-xs text-muted-foreground">
                Prefijo editable (por defecto TKT). El consecutivo aumenta automáticamente en cada venta.
              </p>
              {numbering.map((n) => (
                <div key={n.id} className="flex flex-wrap items-end gap-3 text-sm border-t border-border/60 pt-3 first:border-0 first:pt-0">
                  <label className="text-xs text-muted-foreground">
                    Prefijo
                    <input
                      className="mt-1 w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono uppercase"
                      placeholder={n.prefix}
                      value={prefixEdit[n.id] ?? ''}
                      onChange={(e) =>
                        setPrefixEdit((m) => ({ ...m, [n.id]: e.target.value.toUpperCase() }))
                      }
                    />
                  </label>
                  <div>
                    <span className="text-muted-foreground text-xs">Siguiente número</span>
                    <p className="font-mono font-medium tabular-nums">
                      {n.prefix}-{n.currentNumber + 1}
                    </p>
                  </div>
                  <label className="flex-1 min-w-[12rem] text-xs text-muted-foreground">
                    Nota interna (opcional, no se imprime en el ticket)
                    <input
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      placeholder={n.resolutionNumber || 'Opcional'}
                      value={numEdit[n.id] ?? ''}
                      onChange={(e) => setNumEdit((m) => ({ ...m, [n.id]: e.target.value }))}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={
                      busy || (!(numEdit[n.id]?.trim()) && !(prefixEdit[n.id]?.trim()))
                    }
                    onClick={() => void saveNumbering(n)}
                    className="rounded-lg border border-input px-3 py-2 text-xs disabled:opacity-40"
                  >
                    Guardar
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por venta, cliente, prefijo…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="text-left p-3 font-medium">Comprobante</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Venta</th>
                <th className="text-left p-3 font-medium">Fecha</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-center p-3 font-medium">Estado</th>
                <th className="p-3 w-28 text-center font-medium">Imprimir</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No hay comprobantes.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 cursor-pointer hover:bg-muted/20"
                    onClick={() => void openDetail(r.id)}
                  >
                    <td className="p-3 font-mono text-xs font-medium">{r.fullNumber}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground font-mono text-xs">
                      {r.saleNumber}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(r.date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="p-3 text-right tabular-nums">{cop.format(Number(r.total))}</td>
                    <td className="p-3 text-center">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          invoiceStatusClass(r.status)
                        )}
                      >
                        {INVOICE_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <PrintThermalTicketButton
                        invoiceId={r.id}
                        label="Ticket"
                        className="px-2 py-1 text-[10px]"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {meta.totalPages > 1 && (
            <div className="flex justify-between items-center border-t border-border px-4 py-2 text-sm">
              <span className="text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  className="rounded border border-input px-3 py-1 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  className="rounded border border-input px-3 py-1 disabled:opacity-40"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ventas sin comprobante</h2>
              <button
                type="button"
                className="rounded p-1"
                onClick={() => setGenOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {actionErr && <p className="mt-2 text-sm text-destructive">{actionErr}</p>}
            <ul className="mt-4 space-y-2">
              {eligible.length === 0 ? (
                <li className="text-sm text-muted-foreground">No hay ventas elegibles.</li>
              ) : (
                eligible.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <span className="font-mono text-xs">{s.number}</span>
                      <p className="text-xs text-muted-foreground">
                        {s.customer?.name ?? 'Sin cliente'} ·{' '}
                        {new Date(s.createdAt).toLocaleString('es-CO')}
                      </p>
                      <p className="font-semibold tabular-nums mt-1">{cop.format(Number(s.total))}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void generateFromSale(s.id)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                    >
                      Generar ticket
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            {detailLoading || !detail ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Cargando…</p>
            ) : (
              <>
                <div className="flex justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-mono font-semibold">{detail.fullNumber}</h2>
                  </div>
                  <button
                    type="button"
                    className="rounded border border-input px-2 py-1 text-sm"
                    onClick={() => {
                      setDetailId(null);
                      setDetail(null);
                    }}
                  >
                    Cerrar
                  </button>
                </div>
                {saleAdjustReturn && (
                  <div className="mt-3 flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <p className="text-xs text-primary">
                      Viene desde <strong>Ajustar venta</strong> en caja. Al confirmar la anulación
                      volverá al mismo ajuste para continuar.
                    </p>
                    <button
                      type="button"
                      className="self-start text-xs font-medium text-primary underline hover:no-underline"
                      onClick={() =>
                        navigate(
                          cashSessionSaleAdjustPath(
                            saleAdjustReturn.sessionId,
                            saleAdjustReturn.adjustSale,
                          ),
                        )
                      }
                    >
                      Volver al ajuste sin anular
                    </button>
                  </div>
                )}
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">Cliente:</span>{' '}
                  {detail.customerName}
                  {detail.customerDoc && (
                    <span className="text-muted-foreground"> ({detail.customerDoc})</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Venta {detail.sale.number} · {new Date(detail.date).toLocaleString('es-CO')}
                </p>
                <div className="mt-4 rounded-lg border border-border divide-y divide-border">
                  {detail.sale.items.map((it) => (
                    <div key={it.id} className="flex justify-between gap-2 px-3 py-2 text-sm">
                      <span>
                        <span className="font-mono text-xs text-muted-foreground">{it.product.sku}</span>{' '}
                        {it.product.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {it.quantity} → {cop.format(Number(it.subtotal))}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-3 text-sm tabular-nums border-t border-border pt-3">
                  <span>Subtotal {cop.format(Number(detail.subtotal))}</span>
                  <span className="text-muted-foreground">IVA {cop.format(Number(detail.taxTotal))}</span>
                  <span className="font-semibold">Total {cop.format(Number(detail.total))}</span>
                </div>
                {(detail.payments?.length ?? 0) > 0 && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/25 p-3 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Información de pago
                    </h3>
                    {detail.payments.map((p) => {
                      const received = roundCop(Number(p.amount));
                      const change = roundCop(Number(p.change));
                      const net = roundCop(received - change);
                      const label = PAYMENT_METHOD_LABEL[p.method] ?? p.method;
                      return (
                        <div key={p.id} className="text-sm space-y-0.5">
                          {p.method === 'CASH' ? (
                            <>
                              <p>
                                <span className="font-medium">{label}</span>
                                <span className="text-muted-foreground"> — Dinero recibido: </span>
                                <span className="tabular-nums font-medium">{cop.format(received)}</span>
                              </p>
                              {change > 0 && (
                                <p className="text-primary pl-2 tabular-nums">
                                  Cambio devuelto: {cop.format(change)}
                                </p>
                              )}
                              <p className="text-muted-foreground pl-2 tabular-nums text-xs">
                                Aplicado a la factura: {cop.format(net)}
                              </p>
                            </>
                          ) : (
                            <p>
                              <span className="font-medium">{label}</span>
                              <span className="text-muted-foreground">: </span>
                              <span className="tabular-nums font-medium">{cop.format(net)}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <PrintThermalTicketButton invoiceId={detail.id} />
                  {detail.pdfUrl && (
                    <button
                      type="button"
                      className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                      onClick={() => void downloadInvoiceFile()}
                    >
                      Descargar PDF
                    </button>
                  )}
                  {canCreate && isInvoiceOperational(detail.status) && (
                    <button
                      type="button"
                      disabled={busy}
                      title="Vuelve a generar el PDF con la plantilla actual"
                      className="rounded-lg border border-dashed border-primary/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                      onClick={() => void regenerateInvoiceFiles()}
                    >
                      Regenerar PDF
                    </button>
                  )}
                </div>
                {canCreate && isInvoiceOperational(detail.status) && detail.pdfUrl && (
                  <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      Enviar por correo
                    </h3>
                    <label className="block text-xs text-muted-foreground">
                      Destinatario
                      <input
                        type="email"
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="cliente@correo.com"
                      />
                    </label>
                    <label className="block text-xs text-muted-foreground">
                      Asunto (opcional)
                      <input
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Usa plantilla si está vacío"
                      />
                    </label>
                    <label className="block text-xs text-muted-foreground">
                      Mensaje (opcional)
                      <textarea
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[64px]"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy || !emailTo.trim()}
                      onClick={() => void sendInvoiceEmail()}
                      className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      Enviar comprobante por correo
                    </button>
                    <p className="text-[10px] text-muted-foreground">
                      Configure SMTP en Ticket / Comprobante → Correo (permiso invoices.config).
                    </p>
                  </div>
                )}
                {actionErr && <p className="mt-3 text-sm text-destructive">{actionErr}</p>}
                {canCancel && isInvoiceOperational(detail.status) && (
                  <button
                    type="button"
                    onClick={() => setCancelConfirmOpen(true)}
                    className="mt-4 w-full rounded-lg border border-destructive/40 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    Anular comprobante
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <AppConfirmDialog
        open={cancelConfirmOpen}
        title="¿Anular este comprobante?"
        description={
          detail
            ? saleAdjustReturn
              ? `El comprobante ${detail.fullNumber} quedará anulado. Al confirmar volverá al ajuste de venta en caja para continuar.`
              : `El comprobante ${detail.fullNumber} quedará anulado. Después podrá corregir la venta en caja y el comprobante volverá como Activo (ajustado).`
            : undefined
        }
        confirmLabel="Sí, anular"
        cancelLabel="No, volver"
        busy={busy}
        onConfirm={() => void confirmCancelInvoice()}
        onCancel={() => {
          if (!busy) setCancelConfirmOpen(false);
        }}
        variant="destructive"
      />
    </div>
  );
}
