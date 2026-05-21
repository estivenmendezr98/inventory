import { useSidebarStore } from '../../stores/sidebar.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  BookOpen,
  Users,
  Truck,
  ShoppingCart,
  Monitor,
  Receipt,
  DollarSign,
  BarChart3,
  FileText,
  Bell,
  Shield,
  Settings,
  Database,
  Activity,
  ChevronLeft,
  ChevronRight,
  Box,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useCompanyBrandingStore } from '../../stores/company-branding.store';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/', permission: 'dashboard.view' },
  { label: 'Notificaciones', icon: Bell, href: '/notifications', permission: 'notifications.view' },
  { label: 'Productos', icon: Package, href: '/products', permission: 'products.view' },
  { label: 'Categorías', icon: FolderTree, href: '/categories', permission: 'categories.view' },
  { label: 'Inventario', icon: Warehouse, href: '/inventory', permission: 'inventory.view' },
  { label: 'Kardex', icon: BookOpen, href: '/kardex', permission: 'kardex.view' },
  { label: 'Proveedores', icon: Truck, href: '/suppliers', permission: 'suppliers.view' },
  { label: 'Compras', icon: ShoppingCart, href: '/purchases', permission: 'purchases.view' },
  { label: 'Clientes', icon: Users, href: '/customers', permission: 'customers.view' },
  { label: 'Ventas', icon: Receipt, href: '/sales', permission: 'sales.view' },
  { label: 'POS', icon: Monitor, href: '/pos', permission: 'pos.access' },
  { label: 'Caja', icon: DollarSign, href: '/cash-register', permission: 'cash_register.open' },
  { label: 'Ticket / Comprobante local', icon: FileText, href: '/invoices', permission: 'invoices.view' },
  { label: 'Reportes', icon: BarChart3, href: '/reports', permission: 'reports.view' },
  { label: 'Usuarios', icon: Users, href: '/users', permission: 'users.view' },
  { label: 'Roles', icon: Shield, href: '/roles', permission: 'roles.view' },
  { label: 'Auditoría', icon: BookOpen, href: '/audit', permission: 'audit.view' },
  { label: 'Documentos', icon: FileText, href: '/documents', permission: 'documents.view' },
  { label: 'Configuración', icon: Settings, href: '/settings', permission: 'settings.view' },
  { label: 'Backups', icon: Database, href: '/backups', permission: 'backups.create' },
  { label: 'Monitoreo', icon: Activity, href: '/monitoring', permission: 'monitoring.view' },
];

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore();
  const { hasPermission } = useAuthStore();
  const logoSrc = useCompanyBrandingStore((s) => s.logoSrc);

  const cashPermissions = [
    'cash_register.open',
    'cash_register.close',
    'cash_register.movement',
    'cash_register.view_all',
  ];

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.href === '/cash-register') {
      return cashPermissions.some((p) => hasPermission(p));
    }
    return !item.permission || hasPermission(item.permission);
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-3 min-w-0">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Logo"
              className="h-8 w-8 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Box className="h-4 w-4" />
            </div>
          )}
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight animate-fade-in truncate">
              Inventory
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground',
                isCollapsed && 'justify-center px-2'
              )
            }
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <span className="animate-fade-in truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
