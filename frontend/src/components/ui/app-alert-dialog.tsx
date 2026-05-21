import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';
import { invoicesPath } from '../../lib/module-links';
import { cn } from '../../lib/utils';

interface AppAlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  confirmLabel?: string;
  /** Si se indica, «Ir a comprobantes» abre el detalle (`/invoices?open=…`). */
  invoiceId?: string | null;
  /** Enlace completo (p. ej. con retorno al ajuste de venta en caja). */
  invoicesLinkTo?: string | null;
  variant?: 'warning' | 'info';
}

export function AppAlertDialog({
  open,
  title,
  description,
  onClose,
  confirmLabel = 'Entendido',
  invoiceId = null,
  invoicesLinkTo = null,
  variant = 'warning',
}: AppAlertDialogProps) {
  if (!open) return null;

  const invoicesTo = invoicesLinkTo ?? (invoiceId ? invoicesPath(invoiceId) : null);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-alert-title"
        aria-describedby="app-alert-desc"
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-border px-4 py-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              variant === 'warning'
                ? 'bg-amber-500/15 text-amber-600'
                : 'bg-primary/10 text-primary',
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="app-alert-title" className="text-base font-semibold leading-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 hover:bg-muted"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p id="app-alert-desc" className="px-4 py-4 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end">
          {invoicesTo && (
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link to={invoicesTo} onClick={onClose}>
                Ir a comprobantes
              </Link>
            </Button>
          )}
          <Button className="w-full sm:w-auto" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
