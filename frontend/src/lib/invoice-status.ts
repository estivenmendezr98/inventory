export const INVOICE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  ACTIVE_ADJUSTED: 'Activo',
  CANCELLED: 'Anulado',
  VOIDED: 'Anulado',
};

export function invoiceStatusClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500/15 text-green-500';
    case 'ACTIVE_ADJUSTED':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    case 'CANCELLED':
      return 'bg-muted text-muted-foreground';
    case 'VOIDED':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-muted';
  }
}

/** Factura vigente (activa o ya corregida por un ajuste anterior). */
export function isInvoiceOperational(status: string): boolean {
  return status === 'ACTIVE' || status === 'ACTIVE_ADJUSTED';
}

/** Debe anularse el comprobante antes de otro ajuste de venta. */
export function mustCancelInvoiceBeforeAdjustment(status: string | undefined | null): boolean {
  return status === 'ACTIVE' || status === 'ACTIVE_ADJUSTED';
}

export const INVOICE_ACTIVE_WARNING =
  'La venta tiene comprobante activo. Anúlelo en Ticket / Comprobante antes de aplicar el ajuste; después quedará como Activo (ajustado) con los totales actualizados.';

export const INVOICE_ACTIVE_ADJUSTED_WARNING =
  'El comprobante está activo (ajustado). Anúlelo nuevamente antes de otro ajuste; después volverá como Activo (ajustado) con los totales actualizados.';

export const INVOICE_CANCELLED_HINT =
  'Comprobante anulado. Al aplicar el ajuste se reactivará como Activo (ajustado) con los totales corregidos.';

export const INVOICE_REACTIVATED_SUCCESS =
  'El comprobante quedó en estado Activo (ajustado) con los totales de la venta corregidos. Puede reimprimir el PDF desde Ticket / Comprobante.';
