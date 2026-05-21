export const SALE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completada',
  SUSPENDED: 'Suspendida',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
};

export function saleStatusClass(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500/15 text-green-500';
    case 'PENDING':
      return 'bg-amber-500/15 text-amber-500';
    case 'SUSPENDED':
      return 'bg-blue-500/15 text-blue-400';
    case 'CANCELLED':
      return 'bg-muted text-muted-foreground';
    case 'REFUNDED':
      return 'bg-purple-500/15 text-purple-400';
    default:
      return 'bg-muted';
  }
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  MIXED: 'Mixto',
};
