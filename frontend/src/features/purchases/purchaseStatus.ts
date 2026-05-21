export const PURCHASE_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  ORDERED: 'Ordenada',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
};

export function purchaseStatusClass(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-muted text-muted-foreground';
    case 'ORDERED':
      return 'bg-blue-500/15 text-blue-400';
    case 'RECEIVED':
      return 'bg-green-500/15 text-green-500';
    case 'CANCELLED':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-muted';
  }
}
