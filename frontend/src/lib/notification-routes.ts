/** Ruta interna según módulo y entidad de la notificación. */
export function getNotificationHref(
  module: string | null | undefined,
  entityId: string | null | undefined,
): string | null {
  if (!module?.trim() || !entityId?.trim()) return null;
  const m = module.trim().toLowerCase();
  const id = entityId.trim();

  switch (m) {
    case 'inventory':
    case 'products':
      return `/kardex?productId=${encodeURIComponent(id)}`;
    case 'sales':
      return `/sales?open=${encodeURIComponent(id)}`;
    case 'invoices':
      return `/invoices?open=${encodeURIComponent(id)}`;
    case 'purchases':
      return `/purchases?open=${encodeURIComponent(id)}`;
    case 'cash-register':
    case 'cash_register':
      return `/cash-register/sessions/${encodeURIComponent(id)}`;
    case 'customers':
      return `/customers`;
    case 'suppliers':
      return `/suppliers`;
    default:
      return null;
  }
}

export const NOTIFICATION_MODULE_LABELS: Record<string, string> = {
  inventory: 'Inventario',
  products: 'Productos',
  sales: 'Ventas',
  invoices: 'Comprobantes',
  purchases: 'Compras',
  'cash-register': 'Caja',
  customers: 'Clientes',
  suppliers: 'Proveedores',
  system: 'Sistema',
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  info: 'Información',
  success: 'Éxito',
  warning: 'Advertencia',
  error: 'Error',
};
