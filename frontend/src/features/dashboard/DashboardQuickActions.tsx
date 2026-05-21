import { Link } from 'react-router-dom';
import type { ElementType } from 'react';
import {
  Monitor,
  Receipt,
  DollarSign,
  Warehouse,
  ShoppingCart,
  FileText,
  BarChart3,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: ElementType;
  accent: string;
}

interface DashboardQuickActionsProps {
  hasPermission: (code: string) => boolean;
}

export function DashboardQuickActions({ hasPermission }: DashboardQuickActionsProps) {
  const actions: QuickAction[] = [];

  if (hasPermission('pos.access')) {
    actions.push({
      label: 'Punto de venta',
      description: 'Cobrar en mostrador',
      href: '/pos',
      icon: Monitor,
      accent: 'bg-primary/10 text-primary',
    });
  }
  if (hasPermission('sales.view')) {
    actions.push({
      label: 'Ventas',
      description: 'Historial y detalle',
      href: '/sales',
      icon: Receipt,
      accent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    });
  }
  const cashOk = ['cash_register.open', 'cash_register.close', 'cash_register.movement'].some(
    (p) => hasPermission(p),
  );
  if (cashOk) {
    actions.push({
      label: 'Caja',
      description: 'Turnos y arqueo',
      href: '/cash-register',
      icon: DollarSign,
      accent: 'bg-green-500/10 text-green-600 dark:text-green-500',
    });
  }
  if (hasPermission('inventory.view')) {
    actions.push({
      label: 'Inventario',
      description: 'Existencias y alertas',
      href: '/inventory',
      icon: Warehouse,
      accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    });
  }
  if (hasPermission('products.view')) {
    actions.push({
      label: 'Productos',
      description: 'Catálogo y precios',
      href: '/products',
      icon: Package,
      accent: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    });
  }
  if (hasPermission('purchases.view')) {
    actions.push({
      label: 'Compras',
      description: 'Órdenes a proveedores',
      href: '/purchases',
      icon: ShoppingCart,
      accent: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    });
  }
  if (hasPermission('invoices.view')) {
    actions.push({
      label: 'Ticket / Comprobante local',
      description: 'Comprobantes y plantilla',
      href: '/invoices',
      icon: FileText,
      accent: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    });
  }
  if (hasPermission('reports.view')) {
    actions.push({
      label: 'Reportes',
      description: 'Exportar y analizar',
      href: '/reports',
      icon: BarChart3,
      accent: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    });
  }

  if (actions.length === 0) return null;

  return (
    <section aria-labelledby="dashboard-quick-actions">
      <h2 id="dashboard-quick-actions" className="text-sm font-semibold text-muted-foreground mb-3">
        Accesos rápidos
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.href} to={a.href} className="group block">
            <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-md">
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    a.accent,
                  )}
                >
                  <a.icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm group-hover:text-primary">{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
