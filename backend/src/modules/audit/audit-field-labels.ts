/** Etiquetas en español para rutas JSON del diff (personas no técnicas). */
const FIELD_LABELS: Record<string, string> = {
  total: 'Total de la venta',
  subtotal: 'Subtotal',
  items: 'Productos de la venta',
  quantity: 'Cantidad',
  productId: 'Producto',
  reason: 'Motivo del cambio',
  adjustmentId: 'Ajuste registrado',
  changes: 'Detalle de cambios',
  previousQty: 'Cantidad anterior en bodega',
  newQty: 'Cantidad nueva en bodega',
  email: 'Correo electrónico',
  firstName: 'Nombre',
  lastName: 'Apellido',
  phone: 'Teléfono',
  roleId: 'Rol asignado',
  roleName: 'Nombre del rol',
  isActive: 'Cuenta activa',
  passwordChanged: 'Contraseña cambiada',
  permissionIds: 'Lista de permisos (IDs)',
  permissionCodes: 'Permisos del rol',
  openingAmount: 'Monto de apertura de caja',
  closingAmount: 'Monto de cierre',
  expectedAmount: 'Monto esperado en arqueo',
  difference: 'Diferencia de arqueo',
  status: 'Estado',
  type: 'Tipo de movimiento',
  amount: 'Monto',
  description: 'Descripción',
  updated: 'Usuarios actualizados',
  skipped: 'Usuarios omitidos',
  totalKc: 'Total en servidor de acceso',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  User: 'usuario',
  Role: 'rol',
  Product: 'producto',
  Sale: 'venta',
  CashSession: 'sesión de caja',
  CashMovement: 'movimiento de caja',
};

export function entityTypeLabel(entityType: string | null): string {
  if (!entityType) return 'registro del sistema';
  return ENTITY_TYPE_LABELS[entityType] ?? entityType.toLowerCase();
}

export function fieldPathLabel(path: string): string {
  if (!path || path === '(raíz)') return 'Datos generales';
  const segments = path.split('.');
  const last = segments[segments.length - 1] ?? path;
  if (FIELD_LABELS[last]) return FIELD_LABELS[last];
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function permissionCodeLabel(code: string): string {
  const parts = code.split('.');
  const module = parts[0]?.replace(/_/g, ' ') ?? code;
  const action = parts[1]?.replace(/_/g, ' ') ?? '';
  const map: Record<string, string> = {
    view: 'ver',
    create: 'crear',
    update: 'editar',
    delete: 'eliminar',
    upload: 'subir archivos',
    restore: 'restaurar',
    access: 'acceder',
    open: 'abrir',
    close: 'cerrar',
    movement: 'registrar movimientos',
  };
  const verb = map[action] ?? action;
  return `${verb} ${module}`.trim();
}

export function roleNameLabel(roleName: string | null): string {
  if (!roleName) return 'sin rol';
  const map: Record<string, string> = {
    SUPER_ADMINISTRADOR: 'superadministrador',
    ADMINISTRADOR: 'administrador',
    CAJERO: 'cajero',
  };
  return map[roleName] ?? roleName.replace(/_/g, ' ').toLowerCase();
}
