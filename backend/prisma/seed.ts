import { PrismaClient, RoleName } from '@prisma/client';
import { UNITS_OF_MEASURE_SEED } from '../src/modules/products/units-of-measure.constants';

const prisma = new PrismaClient();

// ============================================
// Definición de Permisos del Sistema
// ============================================

interface PermissionDef {
  code: string;
  name: string;
  module: string;
  description: string;
  roles: RoleName[];
}

const PERMISSIONS: PermissionDef[] = [
  // --- Dashboard ---
  { code: 'dashboard.view', name: 'Ver Dashboard', module: 'dashboard', description: 'Acceso al dashboard principal', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'dashboard.view_analytics', name: 'Ver Analíticas', module: 'dashboard', description: 'Acceso a analíticas y métricas avanzadas', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },

  // --- Productos ---
  { code: 'products.view', name: 'Ver Productos', module: 'products', description: 'Listar y ver detalle de productos', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'products.create', name: 'Crear Productos', module: 'products', description: 'Crear nuevos productos', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'products.update', name: 'Editar Productos', module: 'products', description: 'Editar productos existentes', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'products.delete', name: 'Eliminar Productos', module: 'products', description: 'Eliminar productos del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Categorías ---
  { code: 'categories.view', name: 'Ver Categorías', module: 'categories', description: 'Listar y ver categorías', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'categories.create', name: 'Crear Categorías', module: 'categories', description: 'Crear nuevas categorías', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'categories.update', name: 'Editar Categorías', module: 'categories', description: 'Editar categorías existentes', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'categories.delete', name: 'Eliminar Categorías', module: 'categories', description: 'Eliminar categorías del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Inventario ---
  { code: 'inventory.view', name: 'Ver Inventario', module: 'inventory', description: 'Consultar stock e inventario', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'inventory.adjust', name: 'Ajustar Inventario', module: 'inventory', description: 'Realizar ajustes de inventario', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },

  // --- Kardex ---
  { code: 'kardex.view', name: 'Ver Kardex', module: 'kardex', description: 'Consultar movimientos de kardex', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },

  // --- Proveedores ---
  { code: 'suppliers.view', name: 'Ver Proveedores', module: 'suppliers', description: 'Listar y ver proveedores', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'suppliers.create', name: 'Crear Proveedores', module: 'suppliers', description: 'Crear nuevos proveedores', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'suppliers.update', name: 'Editar Proveedores', module: 'suppliers', description: 'Editar proveedores existentes', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'suppliers.delete', name: 'Eliminar Proveedores', module: 'suppliers', description: 'Eliminar proveedores del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Compras ---
  { code: 'purchases.view', name: 'Ver Compras', module: 'purchases', description: 'Listar y ver compras', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'purchases.create', name: 'Crear Compras', module: 'purchases', description: 'Registrar nuevas compras', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'purchases.update', name: 'Editar Compras', module: 'purchases', description: 'Editar compras existentes', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'purchases.delete', name: 'Eliminar Compras', module: 'purchases', description: 'Eliminar compras del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Ventas ---
  { code: 'sales.view', name: 'Ver Ventas', module: 'sales', description: 'Listar y ver ventas', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'sales.create', name: 'Crear Ventas', module: 'sales', description: 'Registrar nuevas ventas', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'sales.cancel', name: 'Cancelar Ventas', module: 'sales', description: 'Cancelar ventas registradas', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'sales.refund', name: 'Reembolsar Ventas', module: 'sales', description: 'Procesar reembolsos de ventas', roles: ['SUPER_ADMINISTRADOR'] },
  { code: 'sales.adjust', name: 'Ajustar Ventas', module: 'sales', description: 'Corregir líneas de ventas (caja cerrada)', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },

  // --- POS ---
  { code: 'pos.access', name: 'Acceso POS', module: 'pos', description: 'Acceso al punto de venta', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'pos.apply_discount', name: 'Aplicar Descuento POS', module: 'pos', description: 'Aplicar descuentos en el POS', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'pos.suspend_sale', name: 'Suspender Venta POS', module: 'pos', description: 'Suspender ventas en el POS', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'pos.resume_sale', name: 'Reanudar Venta POS', module: 'pos', description: 'Reanudar ventas suspendidas en el POS', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },

  // --- Clientes ---
  { code: 'customers.view', name: 'Ver Clientes', module: 'customers', description: 'Listar y ver clientes', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'customers.create', name: 'Crear Clientes', module: 'customers', description: 'Crear nuevos clientes', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'customers.update', name: 'Editar Clientes', module: 'customers', description: 'Editar clientes existentes', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'customers.delete', name: 'Eliminar Clientes', module: 'customers', description: 'Eliminar clientes del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Caja Registradora ---
  { code: 'cash_register.open', name: 'Abrir Caja', module: 'cash_register', description: 'Abrir sesión de caja', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'cash_register.close', name: 'Cerrar Caja', module: 'cash_register', description: 'Cerrar sesión de caja', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'cash_register.movement', name: 'Movimientos de Caja', module: 'cash_register', description: 'Registrar movimientos de caja', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'cash_register.view_all', name: 'Ver Todas las Cajas', module: 'cash_register', description: 'Ver historial de todas las cajas', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'cash_register.manage', name: 'Ajustar Caja (admin)', module: 'cash_register', description: 'Corregir sesiones y movimientos de caja', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Ticket / comprobante local ---
  { code: 'invoices.view', name: 'Ver comprobantes', module: 'invoices', description: 'Listar y ver tickets de venta', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'invoices.create', name: 'Crear comprobantes', module: 'invoices', description: 'Generar comprobantes desde venta', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'invoices.generate', name: 'Generar comprobante', module: 'invoices', description: 'Generar ticket desde venta', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'invoices.cancel', name: 'Anular comprobantes', module: 'invoices', description: 'Anular tickets emitidos', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'invoices.reprint', name: 'Reimprimir tickets', module: 'invoices', description: 'Reimprimir tickets en impresora térmica', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'invoices.config', name: 'Configurar ticket', module: 'invoices', description: 'Formato, numeración e impresión térmica', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Reportes ---
  { code: 'reports.view', name: 'Ver Reportes', module: 'reports', description: 'Acceso a reportes del sistema', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'reports.export', name: 'Exportar Reportes', module: 'reports', description: 'Exportar reportes en PDF/Excel', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },

  // --- Usuarios ---
  { code: 'users.view', name: 'Ver Usuarios', module: 'users', description: 'Listar y ver usuarios', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'users.create', name: 'Crear Usuarios', module: 'users', description: 'Crear nuevos usuarios', roles: ['SUPER_ADMINISTRADOR'] },
  { code: 'users.update', name: 'Editar Usuarios', module: 'users', description: 'Editar usuarios existentes', roles: ['SUPER_ADMINISTRADOR'] },
  { code: 'users.delete', name: 'Eliminar Usuarios', module: 'users', description: 'Eliminar usuarios del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Roles ---
  { code: 'roles.view', name: 'Ver Roles', module: 'roles', description: 'Ver roles del sistema', roles: ['SUPER_ADMINISTRADOR'] },
  { code: 'roles.manage', name: 'Gestionar Roles', module: 'roles', description: 'Gestionar permisos de roles', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Auditoría ---
  { code: 'audit.view', name: 'Ver Auditoría', module: 'audit', description: 'Consultar registros de auditoría', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'audit.export', name: 'Exportar Auditoría', module: 'audit', description: 'Exportar informe de auditoría para revisión legal (CSV/PDF)', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },

  // --- Configuración ---
  { code: 'settings.view', name: 'Ver Configuración', module: 'settings', description: 'Ver configuración del sistema', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'settings.update', name: 'Editar Configuración', module: 'settings', description: 'Modificar configuración del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Backups ---
  { code: 'backups.create', name: 'Crear Backup', module: 'backups', description: 'Crear respaldos del sistema', roles: ['SUPER_ADMINISTRADOR'] },
  { code: 'backups.restore', name: 'Restaurar Backup', module: 'backups', description: 'Restaurar respaldos del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Documentos ---
  { code: 'documents.view', name: 'Ver Documentos', module: 'documents', description: 'Ver documentos del sistema', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] },
  { code: 'documents.upload', name: 'Subir Documentos', module: 'documents', description: 'Subir documentos al sistema', roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR'] },
  { code: 'documents.delete', name: 'Eliminar Documentos', module: 'documents', description: 'Eliminar documentos del sistema', roles: ['SUPER_ADMINISTRADOR'] },

  // --- Notificaciones ---
  {
    code: 'notifications.view',
    name: 'Ver Notificaciones',
    module: 'notifications',
    description: 'Ver y gestionar la bandeja de notificaciones propias',
    roles: ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'],
  },

  // --- Monitoreo ---
  { code: 'monitoring.view', name: 'Ver Monitoreo', module: 'monitoring', description: 'Acceso al panel de monitoreo Netdata', roles: ['SUPER_ADMINISTRADOR'] },
];

// ============================================
// Roles del Sistema
// ============================================

const ROLES = [
  { name: RoleName.SUPER_ADMINISTRADOR, description: 'Super Administrador — Acceso total al sistema, configuración y gestión de usuarios' },
  { name: RoleName.ADMINISTRADOR, description: 'Administrador — Gestión operativa del negocio, inventario, compras y reportes' },
  { name: RoleName.CAJERO, description: 'Cajero — Operaciones de venta, POS y caja registradora' },
];

// ============================================
// Main Seed Function
// ============================================

async function main() {
  console.log('🌱 Iniciando seed del sistema...\n');

  // --- 1. Crear Roles ---
  console.log('📋 Creando roles...');
  const roleMap = new Map<RoleName, string>();

  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description },
    });
    roleMap.set(roleDef.name, role.id);
    console.log(`  ✅ ${roleDef.name} (${role.id})`);
  }

  // --- 2. Crear Permisos ---
  console.log('\n🔑 Creando permisos...');
  const permissionMap = new Map<string, string>();

  for (const permDef of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code: permDef.code },
      update: { name: permDef.name, description: permDef.description, module: permDef.module },
      create: { code: permDef.code, name: permDef.name, description: permDef.description, module: permDef.module },
    });
    permissionMap.set(permDef.code, permission.id);
  }
  console.log(`  ✅ ${PERMISSIONS.length} permisos creados/actualizados`);

  // --- 3. Crear RolePermission ---
  console.log('\n🔗 Asignando permisos a roles...');
  let assignmentCount = 0;

  for (const permDef of PERMISSIONS) {
    const permissionId = permissionMap.get(permDef.code)!;

    for (const roleName of permDef.roles) {
      const roleId = roleMap.get(roleName)!;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
      assignmentCount++;
    }
  }
  console.log(`  ✅ ${assignmentCount} asignaciones role-permission creadas`);

  // --- 4. Crear usuario Super Admin ---
  console.log('\n👤 Creando usuario Super Administrador...');
  const superAdminRoleId = roleMap.get(RoleName.SUPER_ADMINISTRADOR)!;

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@inventory.local' },
    update: { roleId: superAdminRoleId },
    create: {
      email: 'admin@inventory.local',
      firstName: 'Super',
      lastName: 'Administrador',
      roleId: superAdminRoleId,
      isActive: true,
    },
  });
  console.log(`  ✅ ${superAdmin.email} (${superAdmin.id})`);

  // --- 5. Crear Caja por defecto ---
  console.log('\n💰 Creando caja registradora por defecto...');
  await prisma.cashRegister.upsert({
    where: { name: 'Caja Principal' },
    update: {},
    create: { name: 'Caja Principal', isActive: true },
  });
  console.log('  ✅ Caja Principal creada');

  await prisma.invoiceNumbering.upsert({
    where: { prefix: 'TKT' },
    update: {},
    create: {
      prefix: 'TKT',
      resolutionNumber: 'Comprobante de venta — numeración local',
      startNumber: 1,
      endNumber: 4999999,
      currentNumber: 0,
      startDate: new Date(),
      endDate: new Date('2030-12-31T23:59:59.000Z'),
      isActive: true,
    },
  });
  console.log('  ✅ Numeración comprobante TKT-… creada');

  // --- 6. Valores por defecto de configuración ---
  console.log('\n⚙️  Configuración general (app_settings)...');
  const APP_SETTINGS_DEFAULTS: [string, string][] = [
    ['company.name', 'Mi empresa'],
    ['company.tax_id', ''],
    ['company.address', ''],
    ['company.phone', ''],
    ['company.email', ''],
    ['invoice.footer_note', 'Gracias por su compra.'],
    ['pos.receipt_header', ''],
  ];
  for (const [key, value] of APP_SETTINGS_DEFAULTS) {
    await prisma.appSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log(`  ✅ ${APP_SETTINGS_DEFAULTS.length} claves de configuración`);

  // --- 6b. Unidades de medida (catálogo fijo, ids alineados con migración) ---
  console.log('\n📏 Unidades de medida...');
  for (const u of UNITS_OF_MEASURE_SEED) {
    await prisma.unitOfMeasure.upsert({
      where: { code: u.code },
      update: {
        name: u.name,
        symbol: u.symbol,
        category: u.category,
        allowsDecimals: u.allowsDecimals,
        decimalPlaces: u.decimalPlaces,
        sortOrder: u.sortOrder,
        isActive: true,
      },
      create: u,
    });
  }
  console.log(`  ✅ ${UNITS_OF_MEASURE_SEED.length} unidades de medida`);

  // --- 7. Catálogo demo (listas no vacías en la UI tras seed / E2E) ---
  console.log('\n📦 Catálogo de demostración...');
  let demoCategory = await prisma.category.findFirst({
    where: { name: 'General', isActive: true },
  });
  if (!demoCategory) {
    demoCategory = await prisma.category.create({
      data: { name: 'General', isActive: true },
    });
  }
  const demoProduct = await prisma.product.upsert({
    where: { sku: 'DEMO-001' },
    update: { isActive: true, categoryId: demoCategory.id },
    create: {
      sku: 'DEMO-001',
      name: 'Producto de demostración',
      costPrice: 10000,
      salePrice: 15000,
      taxRate: 0,
      minStock: 0,
      maxStock: 1000,
      categoryId: demoCategory.id,
      unitOfMeasureId: 'uom-un',
      isActive: true,
    },
  });
  await prisma.inventory.upsert({
    where: { productId: demoProduct.id },
    update: { quantity: 100, reservedQty: 0 },
    create: { productId: demoProduct.id, quantity: 100, reservedQty: 0 },
  });
  console.log(`  ✅ Categoría «General», producto ${demoProduct.sku} + stock`);

  // --- Summary ---
  const totalPerms = await prisma.permission.count();
  const totalRolePerms = await prisma.rolePermission.count();

  console.log('\n========================================');
  console.log('📊 Resumen del Seed:');
  console.log(`   Roles:              ${ROLES.length}`);
  console.log(`   Permisos:           ${totalPerms}`);
  console.log(`   Role-Permisos:      ${totalRolePerms}`);
  console.log(`   Usuarios:           1 (superadmin)`);
  console.log(`   Cajas:              1 (Caja Principal)`);
  console.log(`   Numeración FE:      1 (prefijo FE)`);
  const settingCount = await prisma.appSetting.count();
  console.log(`   App settings:       ${settingCount}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
