import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch } from '../../lib/api';
import { salesPath } from '../../lib/module-links';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  ClipboardList,
  Boxes,
  RefreshCw,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import type { DashboardSummary } from './dashboard.types';
import {
  formatCop,
  formatDashboardDateTime,
  formatRoleLabel,
  pctVsYesterday,
} from './dashboard.utils';
import { DashboardStatCard } from './DashboardStatCard';
import { DashboardQuickActions } from './DashboardQuickActions';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();

  const {
    data: summary,
    isPending: loading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiFetch<DashboardSummary>('/dashboard/summary'),
    refetchInterval: 60_000,
  });

  const loadError = error instanceof Error ? error.message : error ? String(error) : null;

  const stats = useMemo(() => {
    if (!summary) return [];
    const todayTotal = Number(summary.salesTodayTotal);
    const yTotal = Number(summary.salesYesterdayTotal);
    const salesChange = pctVsYesterday(todayTotal, yTotal);
    const period = summary.meta?.salesPeriodLabel ?? 'Hoy';

    return [
      {
        title: 'Ventas del día',
        value: formatCop(summary.salesTodayTotal),
        change: `${salesChange.text} · ${period}`,
        changeType: salesChange.type,
        icon: DollarSign,
        iconClassName: 'bg-green-500/10 text-green-600 dark:text-green-500',
      },
      {
        title: 'Órdenes hoy',
        value: String(summary.salesTodayCount),
        change: 'Ventas completadas',
        changeType: 'neutral' as const,
        icon: ShoppingCart,
        iconClassName: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      },
      {
        title: 'Productos activos',
        value: summary.activeProducts.toLocaleString('es-CO'),
        change:
          summary.lowStockCount > 0
            ? `${summary.lowStockCount} con stock bajo`
            : 'Stock dentro de mínimos',
        changeType: (summary.lowStockCount > 0 ? 'negative' : 'positive') as const,
        icon: Package,
        iconClassName: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      },
      {
        title: 'Clientes nuevos (7 días)',
        value: String(summary.newCustomersWeek),
        change: 'Registrados en la semana',
        changeType: 'neutral' as const,
        icon: Users,
        iconClassName: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      },
    ];
  }, [summary]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
        Cargando resumen…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        <p className="font-medium">Error al cargar el dashboard</p>
        <p className="mt-2 text-muted-foreground">{loadError}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hola, {user?.firstName}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">
            {user?.role ? (
              <>
                Panel operativo · <span className="font-medium">{formatRoleLabel(user.role)}</span>
              </>
            ) : (
              'Resumen según tus permisos del sistema'
            )}
          </p>
          {summary.meta?.generatedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Actualizado {formatDashboardDateTime(summary.meta.generatedAt)}
              {isFetching && !loading ? ' · refrescando…' : ''}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={isFetching}
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })}
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
          Actualizar
        </Button>
      </header>

      {summary.cashSession && (
        <Card
          className={cn(
            'border-l-4',
            summary.cashSession.open ? 'border-l-green-500' : 'border-l-amber-500',
          )}
        >
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Caja</p>
              {summary.cashSession.open ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Turno abierto en{' '}
                  <span className="font-medium text-foreground">
                    {summary.cashSession.registerName}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  No tiene turno abierto. Abra caja antes de vender en POS.
                </p>
              )}
            </div>
            <Button variant={summary.cashSession.open ? 'outline' : 'default'} size="sm" asChild>
              <Link
                to={
                  summary.cashSession.open && summary.cashSession.sessionId
                    ? `/cash-register/sessions/${summary.cashSession.sessionId}`
                    : '/cash-register'
                }
              >
                {summary.cashSession.open ? 'Ver turno' : 'Ir a caja'}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {summary.invoices && summary.invoices.salesWithoutInvoice > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-semibold">Ventas sin comprobante</p>
                <p className="text-sm text-muted-foreground">
                  {summary.invoices.salesWithoutInvoice} venta(s) completada(s) pendientes de
                  ticket o comprobante local.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/invoices">Ir a comprobantes</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <DashboardQuickActions hasPermission={hasPermission} />

      <section aria-labelledby="dashboard-kpis">
        <h2 id="dashboard-kpis" className="sr-only">
          Indicadores principales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <DashboardStatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      {summary.analytics && hasPermission('dashboard.view_analytics') && (
        <section aria-labelledby="dashboard-analytics">
          <h2
            id="dashboard-analytics"
            className="text-sm font-semibold text-muted-foreground mb-3"
          >
            Analítica (administración)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                  <p className="text-xs font-medium text-muted-foreground">Ventas 7 días</p>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCop(summary.analytics.salesWeekTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.analytics.salesWeekCount} órdenes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
                  <p className="text-xs font-medium text-muted-foreground">Compras pendientes</p>
                </div>
                <p className="text-2xl font-bold">{summary.analytics.purchasesPending}</p>
                <p className="text-xs text-muted-foreground mt-1">Borrador u ordenadas</p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-2">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Boxes className="h-4 w-4 text-primary" aria-hidden />
                  <p className="text-xs font-medium text-muted-foreground">
                    Valor inventario (costo)
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCop(summary.analytics.inventoryValueEstimate)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Σ cantidad × costo unitario</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
                <h2 className="text-lg font-semibold">Stock bajo</h2>
              </div>
              {hasPermission('inventory.view') && summary.lowStockCount > 0 && (
                <Link
                  to="/inventory"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Ver inventario
                </Link>
              )}
            </div>
            {summary.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos bajo el mínimo.</p>
            ) : (
              <ul className="space-y-2">
                {summary.lowStockItems.map((p) => (
                  <li
                    key={p.productId}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium truncate block">{p.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{p.sku}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300 tabular-nums">
                      {p.quantity} / mín {p.minStock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {hasPermission('sales.view') && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="text-lg font-semibold">Ventas recientes</h2>
                </div>
                <Link to="/sales" className="text-xs text-primary hover:underline font-medium">
                  Ver todas
                </Link>
              </div>
              {!summary.recentSales?.length ? (
                <p className="text-sm text-muted-foreground">Aún no hay ventas completadas.</p>
              ) : (
                <ul className="space-y-2">
                  {summary.recentSales.map((sale) => (
                    <li key={sale.id}>
                      <Link
                        to={salesPath({ open: sale.id })}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-medium font-mono">{sale.number}</span>
                          <span className="block text-xs text-muted-foreground">
                            {formatDashboardDateTime(sale.createdAt)}
                          </span>
                        </div>
                        <span className="shrink-0 font-semibold text-green-600 dark:text-green-500 tabular-nums">
                          {formatCop(sale.total)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
