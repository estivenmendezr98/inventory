import { useCallback, useState } from 'react';
import { Printer } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { printThermalReceipt } from '../../lib/thermal-print';
import type { ThermalReceiptPayload } from '../../lib/thermal-receipt-types';
import { ThermalReceiptPreview } from './ThermalReceiptPreview';
import { cn } from '../../lib/utils';

type Props = {
  invoiceId: string;
  label?: string;
  className?: string;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
};

export function PrintThermalTicketButton({
  invoiceId,
  label = 'Imprimir ticket',
  className,
  variant = 'outline',
  disabled,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ThermalReceiptPayload | null>(null);

  const loadReceipt = useCallback(async () => {
    return apiFetch<ThermalReceiptPayload>(`/invoices/${invoiceId}/thermal-receipt`);
  }, [invoiceId]);

  const runPrint = useCallback(
    async (skipPreview?: boolean) => {
      setBusy(true);
      setErr(null);
      try {
        const data = await loadReceipt();
        if (!skipPreview && data.template.previewBeforePrint) {
          setPreviewData(data);
          setPreviewOpen(true);
          return;
        }
        printThermalReceipt(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'No se pudo imprimir');
      } finally {
        setBusy(false);
      }
    },
    [loadReceipt],
  );

  const confirmPrint = () => {
    if (!previewData) return;
    printThermalReceipt(previewData);
    setPreviewOpen(false);
    setPreviewData(null);
  };

  const base =
    variant === 'primary'
      ? 'rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50'
      : 'rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted/50 disabled:opacity-50';

  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void runPrint()}
        className={cn(base, 'inline-flex items-center gap-1.5', className)}
      >
        <Printer className="h-4 w-4 shrink-0" aria-hidden />
        {busy ? 'Preparando…' : label}
      </button>
      {err && <p className="text-xs text-destructive mt-1">{err}</p>}

      {previewOpen && previewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Vista previa del ticket</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Revise el contenido. Al confirmar se abrirá el diálogo de impresión del sistema; elija
              su impresora térmica (58 mm u 80 mm).
              {previewData.template.printerHint.trim() && (
                <span className="block mt-1">
                  Sugerida: <strong>{previewData.template.printerHint}</strong>
                </span>
              )}
            </p>
            <ThermalReceiptPreview data={previewData} />
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                className="rounded-lg border border-input px-3 py-2 text-sm"
                onClick={() => {
                  setPreviewOpen(false);
                  setPreviewData(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                onClick={confirmPrint}
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
