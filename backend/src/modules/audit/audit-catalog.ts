export type AuditOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'OTHER';
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditActionMeta {
  label: string;
  operation: AuditOperation;
  severity: AuditSeverity;
  hint?: string;
}

export const AUDIT_MODULE_LABELS: Record<string, string> = {
  users: 'Usuarios',
  roles: 'Roles y permisos',
  inventory: 'Inventario',
  sales: 'Ventas',
  cash_register: 'Caja registradora',
  invoices: 'Ticket / Comprobante',
  settings: 'Configuración',
  products: 'Productos',
  purchases: 'Compras',
  customers: 'Clientes',
  suppliers: 'Proveedores',
  categories: 'Categorías',
  backups: 'Respaldos',
  documents: 'Documentos',
};

export const AUDIT_ACTION_CATALOG: Record<string, AuditActionMeta> = {
  'user.create': {
    label: 'Alta de usuario',
    operation: 'CREATE',
    severity: 'high',
    hint: 'Esa persona podrá iniciar sesión con su correo y el rol asignado.',
  },
  'user.update': {
    label: 'Modificación de usuario',
    operation: 'UPDATE',
    severity: 'high',
    hint: 'Cambió nombre, rol, teléfono o contraseña de acceso.',
  },
  'user.deactivate': {
    label: 'Desactivación de usuario',
    operation: 'DELETE',
    severity: 'critical',
    hint: 'La persona ya no debería poder entrar al sistema.',
  },
  'user.sync_keycloak': {
    label: 'Sincronización Keycloak',
    operation: 'SYNC',
    severity: 'medium',
    hint: 'Se alinearon las cuentas con el servidor de inicio de sesión.',
  },
  'role.permissions_update': {
    label: 'Cambio de permisos del rol',
    operation: 'UPDATE',
    severity: 'critical',
    hint: 'Cambió qué puede ver y hacer cada usuario con ese rol.',
  },
  'inventory.adjust': {
    label: 'Ajuste manual de stock',
    operation: 'UPDATE',
    severity: 'high',
    hint: 'Se corrigió el stock a mano, sin compra ni venta.',
  },
  'sale.adjust': {
    label: 'Ajuste de venta',
    operation: 'UPDATE',
    severity: 'critical',
    hint: 'Se corrigió una venta ya hecha; puede afectar caja y comprobante.',
  },
  'cash_register.session_adjust': {
    label: 'Corrección de sesión de caja',
    operation: 'UPDATE',
    severity: 'critical',
    hint: 'Se corrigieron cifras del turno de caja.',
  },
  'cash_register.movement_adjust': {
    label: 'Corrección de movimiento de caja',
    operation: 'UPDATE',
    severity: 'high',
    hint: 'Se modificó un ingreso o retiro de dinero en caja.',
  },
  'cash_register.movement_delete': {
    label: 'Eliminación de movimiento de caja',
    operation: 'DELETE',
    severity: 'critical',
    hint: 'Se borró un movimiento de dinero del turno.',
  },
  'cash_register.session_open': {
    label: 'Apertura de turno de caja',
    operation: 'CREATE',
    severity: 'medium',
    hint: 'Inició un turno con monto de apertura registrado.',
  },
  'cash_register.session_close': {
    label: 'Cierre de turno de caja',
    operation: 'UPDATE',
    severity: 'high',
    hint: 'Cerró el turno con arqueo y diferencia de caja.',
  },
  'sale.create': {
    label: 'Registro de venta',
    operation: 'CREATE',
    severity: 'high',
    hint: 'Venta completada con productos, pagos y descuento de inventario.',
  },
  'sale.cancel': {
    label: 'Anulación de venta',
    operation: 'DELETE',
    severity: 'critical',
    hint: 'La venta quedó anulada y el stock fue devuelto.',
  },
  'sale.refund': {
    label: 'Reembolso de venta',
    operation: 'UPDATE',
    severity: 'critical',
    hint: 'Venta marcada como reembolsada; inventario restaurado.',
  },
  'invoice.create': {
    label: 'Emisión de comprobante',
    operation: 'CREATE',
    severity: 'high',
    hint: 'Se asignó numeración y totales de la venta a un comprobante.',
  },
  'invoice.cancel': {
    label: 'Anulación de factura',
    operation: 'DELETE',
    severity: 'critical',
    hint: 'Factura anulada; puede incluir nota crédito electrónica.',
  },
  'invoice.numbering_update': {
    label: 'Cambio de numeración de tickets',
    operation: 'UPDATE',
    severity: 'critical',
    hint: 'Modificó prefijo o consecutivo del comprobante.',
  },
  'product.create': {
    label: 'Alta de producto',
    operation: 'CREATE',
    severity: 'medium',
    hint: 'Nuevo artículo en catálogo con precios y SKU.',
  },
  'product.update': {
    label: 'Modificación de producto',
    operation: 'UPDATE',
    severity: 'medium',
    hint: 'Cambió datos, precios o categoría del producto.',
  },
  'product.deactivate': {
    label: 'Baja de producto',
    operation: 'DELETE',
    severity: 'medium',
    hint: 'El producto ya no aparece como activo en catálogo.',
  },
  'purchase.create': {
    label: 'Registro de compra',
    operation: 'CREATE',
    severity: 'medium',
    hint: 'Orden o borrador de compra con líneas y proveedor.',
  },
  'purchase.update': {
    label: 'Modificación de compra',
    operation: 'UPDATE',
    severity: 'high',
    hint: 'Cambió estado, líneas o totales de la compra.',
  },
  'purchase.delete': {
    label: 'Eliminación de compra',
    operation: 'DELETE',
    severity: 'medium',
    hint: 'Compra borrador eliminada del sistema.',
  },
  'purchase.cancel': {
    label: 'Cancelación de compra',
    operation: 'DELETE',
    severity: 'medium',
    hint: 'Compra marcada como cancelada.',
  },
  'customer.create': {
    label: 'Alta de cliente',
    operation: 'CREATE',
    severity: 'low',
    hint: 'Nuevo cliente en el maestro de terceros.',
  },
  'customer.update': {
    label: 'Modificación de cliente',
    operation: 'UPDATE',
    severity: 'low',
    hint: 'Datos de contacto o documento del cliente.',
  },
  'supplier.create': {
    label: 'Alta de proveedor',
    operation: 'CREATE',
    severity: 'low',
    hint: 'Nuevo proveedor para compras.',
  },
  'supplier.update': {
    label: 'Modificación de proveedor',
    operation: 'UPDATE',
    severity: 'low',
    hint: 'Datos del proveedor actualizados.',
  },
  'category.create': {
    label: 'Alta de categoría',
    operation: 'CREATE',
    severity: 'low',
    hint: 'Nueva categoría de productos.',
  },
  'category.update': {
    label: 'Modificación de categoría',
    operation: 'UPDATE',
    severity: 'low',
    hint: 'Nombre o jerarquía de categoría.',
  },
  'settings.update': {
    label: 'Cambio de configuración',
    operation: 'UPDATE',
    severity: 'high',
    hint: 'Parámetros globales del sistema modificados.',
  },
  'settings.logo_upload': {
    label: 'Cambio de logo de empresa',
    operation: 'UPDATE',
    severity: 'low',
    hint: 'Imagen de marca actualizada.',
  },
  'settings.logo_delete': {
    label: 'Eliminación de logo de empresa',
    operation: 'DELETE',
    severity: 'low',
    hint: 'Se quitó el logo configurado.',
  },
  'backup.create': {
    label: 'Respaldo de base de datos',
    operation: 'CREATE',
    severity: 'high',
    hint: 'Se generó un archivo de respaldo SQL.',
  },
  'backup.delete': {
    label: 'Eliminación de respaldo',
    operation: 'DELETE',
    severity: 'high',
    hint: 'Archivo de respaldo borrado del servidor.',
  },
  'document.delete': {
    label: 'Eliminación de documento',
    operation: 'DELETE',
    severity: 'medium',
    hint: 'Archivo adjunto eliminado.',
  },
};

export function moduleLabel(module: string): string {
  return AUDIT_MODULE_LABELS[module] ?? module;
}

export function actionMeta(action: string): AuditActionMeta {
  const known = AUDIT_ACTION_CATALOG[action];
  if (known) return known;

  const op: AuditOperation = action.includes('create')
    ? 'CREATE'
    : action.includes('delete') || action.includes('deactivate')
      ? 'DELETE'
      : action.includes('sync')
        ? 'SYNC'
        : action.includes('update') || action.includes('adjust')
          ? 'UPDATE'
          : 'OTHER';

  return {
    label: action.replace(/\./g, ' · '),
    operation: op,
    severity: op === 'DELETE' ? 'high' : 'medium',
  };
}
