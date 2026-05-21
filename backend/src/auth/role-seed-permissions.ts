import { RoleName } from '@prisma/client';

/**
 * Permisos canónicos por rol (alineado con `prisma/seed.ts` y el fallback del frontend).
 * Se usa para completar GET /auth/me y el guard cuando faltan filas en `role_permissions`
 * (BD creada o migrada antes de nuevos módulos como Documentos).
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

const BY_ROLE: Partial<Record<RoleName, readonly string[]>> = {
  [RoleName.ADMINISTRADOR]: ADMINISTRADOR,
  [RoleName.CAJERO]: CAJERO,
};

export function getSeedPermissionsForRole(role: RoleName): readonly string[] {
  return BY_ROLE[role] ?? [];
}
