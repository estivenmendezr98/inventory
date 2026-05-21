import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

interface AppConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  variant?: 'destructive' | 'default';
}

export function AppConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  busy = false,
  variant = 'destructive',
}: AppConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-confirm-title"
        aria-describedby={description ? 'app-confirm-desc' : undefined}
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-border px-4 py-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              variant === 'destructive'
                ? 'bg-destructive/15 text-destructive'
                : 'bg-amber-500/15 text-amber-600',
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="app-confirm-title" className="text-base font-semibold leading-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="shrink-0 rounded-lg p-1 hover:bg-muted disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {description && (
          <p
            id="app-confirm-desc"
            className="px-4 py-4 text-sm text-muted-foreground leading-relaxed"
          >
            {description}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Procesando…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
