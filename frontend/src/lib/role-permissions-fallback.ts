/**
 * Normaliza el nombre de rol (Keycloak / API pueden variar espacios y mayúsculas).
 */
export function normalizeRoleName(role: string | undefined): string {
  if (!role) return '';
  return String(role)
    .trim()
    .replace(/[-\s]+/g, '_')
    .toUpperCase();
}

/**
 * Permisos por rol cuando el frontend no recibió la lista desde GET /auth/me
 * (p. ej. API caída) pero sí el nombre del rol desde Keycloak.
 * Debe mantenerse alineado con `backend/prisma/seed.ts` → PERMISSIONS[].roles
 */
const ADMINISTRADOR: readonly string[] = [
  'dashboard.view',
  'dashboard.view_analytics',
  'products.view',
  'products.create',
  'products.update',
  'categories.view',
  'categories.create',
  'categories.update',
  'inventory.view',
  'inventory.adjust',
  'kardex.view',
  'suppliers.view',
  'suppliers.create',
  'suppliers.update',
  'purchases.view',
  'purchases.create',
  'purchases.update',
  'sales.view',
  'sales.create',
  'sales.cancel',
  'pos.access',
  'pos.apply_discount',
  'pos.suspend_sale',
  'pos.resume_sale',
  'customers.view',
  'customers.create',
  'customers.update',
  'cash_register.open',
  'cash_register.close',
  'cash_register.movement',
  'cash_register.view_all',
  'invoices.view',
  'invoices.create',
  'invoices.generate',
  'invoices.cancel',
  'invoices.reprint',
  'reports.view',
  'reports.export',
  'users.view',
  'audit.view',
  'settings.view',
  'documents.view',
  'documents.upload',
  'notifications.view',
];

const CAJERO: readonly string[] = [
  'dashboard.view',
  'products.view',
  'categories.view',
  'inventory.view',
  'sales.view',
  'sales.create',
  'pos.access',
  'pos.suspend_sale',
  'pos.resume_sale',
  'customers.view',
  'customers.create',
  'cash_register.open',
  'cash_register.close',
  'cash_register.movement',
  'invoices.view',
  'invoices.create',
  'invoices.generate',
  'invoices.reprint',
  'documents.view',
  'notifications.view',
];

const BY_ROLE: Record<string, readonly string[]> = {
  ADMINISTRADOR,
  CAJERO,
};

/** Códigos de permiso del seed para el rol (vacío si no hay mapa). */
export function getSeedPermissionsForRole(role: string | undefined): readonly string[] {
  const key = normalizeRoleName(role);
  return BY_ROLE[key] ?? [];
}

/** Super administrador: coincide con RoleName en Prisma / Keycloak. */
export function isSuperAdministratorRole(role: string | undefined): boolean {
  return normalizeRoleName(role) === 'SUPER_ADMINISTRADOR';
}
