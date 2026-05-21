import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, buildApiUrl } from '../../lib/api';
import keycloak from '../../lib/keycloak';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import {
  defaultReportRange,
  rangeForPreset,
  type ReportPresetId,
} from '../../lib/report-date-presets';
import type { InventoryReport, PurchasesReport, SalesReport } from './reports.types';
import { ReportPeriodToolbar } from './ReportPeriodToolbar';
import { ReportSeriesChart } from './ReportSeriesChart';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const PURCHASE_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  ORDERED: 'Ordenada',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
};

function buildQuery(params: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') u.set(k, v);
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

function parseFilenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
  if (m?.[1]) return decodeURIComponent(m[1].replace(/"/g, '').trim());
  return fallback;
}

async function downloadSalesCsv(params: { from?: string; to?: string }): Promise<void> {
  const qs = buildQuery(params);
  const url = buildApiUrl(`/reports/export/sales${qs}`);
  const token = keycloak.token;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const filename = parseFilenameFromDisposition(
    res.headers.get('Content-Disposition'),
    'ventas.csv',
  );
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

function SummaryGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">{it.label}</p>
          <p className="text-lg font-semibold tabular-nums mt-0.5">{it.value}</p>
          {it.hint && <p className="text-[10px] text-muted-foreground mt-0.5">{it.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function ReportsPage() {
  const { hasPermission } = useAuthStore();
  const canView = hasPermission('reports.view');
  const canExport = hasPermission('reports.export');

  const initial = defaultReportRange();
  const [preset, setPreset] = useState<ReportPresetId>('month');
  const [periodLabel, setPeriodLabel] = useState(initial.label);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [top, setTop] = useState(20);

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [purchases, setPurchases] = useState<PurchasesReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const applyPreset = useCallback((p: Exclude<ReportPresetId, 'custom'>) => {
    const r = rangeForPreset(p);
    setPreset(p);
    setFrom(r.from);
    setTo(r.to);
    setPeriodLabel(r.label);
  }, []);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    const rangeQs = buildQuery({ from, to });
    const invQs = buildQuery({ top: String(top) });
    try {
      const [s, p, i] = await Promise.all([
        apiFetch<SalesReport>(`/reports/sales${rangeQs}`),
        apiFetch<PurchasesReport>(`/reports/purchases${rangeQs}`),
        apiFetch<InventoryReport>(`/reports/inventory-value${invQs}`),
      ]);
      setSales(s);
      setPurchases(p);
      setInventory(i);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [canView, from, to, top]);

  const onFromChange = (v: string) => {
    setFrom(v);
    setPreset('custom');
    setPeriodLabel('Rango personalizado');
  };

  const onToChange = (v: string) => {
    setTo(v);
    setPreset('custom');
    setPeriodLabel('Rango personalizado');
  };

  const onPresetChange = (p: ReportPresetId) => {
    if (p === 'custom') return;
    applyPreset(p);
  };

  useEffect(() => {
    if (!canView || !from || !to) return;
    const delay = preset === 'custom' ? 400 : 0;
    const timer = window.setTimeout(() => void load(), delay);
    return () => window.clearTimeout(timer);
  }, [from, to, top, canView, load, preset]);

  const onExport = async () => {
    if (!canExport) return;
    setExporting(true);
    setError(null);
    try {
      await downloadSalesCsv({ from, to });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No tienes permiso para ver reportes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Ventas, compras e inventario · períodos por día, semana, mes o hasta 1 año.
          </p>
        </div>
      </header>

      <ReportPeriodToolbar
        from={from}
        to={to}
        preset={preset}
        periodLabel={periodLabel}
        top={top}
        loading={loading}
        exporting={exporting}
        canExport={canExport}
        onFromChange={onFromChange}
        onToChange={onToChange}
        onPresetChange={onPresetChange}
        onTopChange={setTop}
        onRefresh={() => void load()}
        onExport={() => void onExport()}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Ventas (completadas)</h2>
            {sales && (
              <p className="text-sm text-muted-foreground mt-1">
                {sales.meta.fromYmd} → {sales.meta.toYmd}
              </p>
            )}
          </div>

          {sales && (
            <>
              <SummaryGrid
                items={[
                  {
                    label: 'Total vendido',
                    value: cop.format(Number(sales.summary.totalAmount)),
                  },
                  {
                    label: 'Órdenes',
                    value: String(sales.summary.saleCount),
                    hint: `Ticket prom. ${cop.format(Number(sales.summary.averageTicket))}`,
                  },
                  {
                    label: 'IVA',
                    value: cop.format(Number(sales.summary.taxTotalAmount)),
                  },
                  {
                    label: 'Descuentos',
                    value: cop.format(Number(sales.summary.discountTotalAmount)),
                  },
                  {
                    label: 'Canceladas (período)',
                    value: String(sales.summary.cancelledCount),
                  },
                  {
                    label: 'Reembolsadas',
                    value: String(sales.summary.refundedCount),
                  },
                ]}
              />

              <ReportSeriesChart
                rows={sales.series}
                granularity={sales.meta.seriesGranularity}
              />

              {sales.byPaymentMethod.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Por método de pago</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px] text-sm text-left">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="py-2 pr-4">Método</th>
                          <th className="py-2 pr-4">Operaciones</th>
                          <th className="py-2">Neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.byPaymentMethod.map((row) => (
                          <tr key={row.method} className="border-b border-border/60">
                            <td className="py-2 pr-4">{row.label}</td>
                            <td className="py-2 pr-4">{row.count}</td>
                            <td className="py-2 tabular-nums">{cop.format(Number(row.total))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium mb-2">Top productos</h3>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b text-muted-foreground sticky top-0 bg-card">
                          <th className="py-2 pr-2">SKU</th>
                          <th className="py-2 pr-2">Producto</th>
                          <th className="py-2 pr-2">Cant.</th>
                          <th className="py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.topProducts.map((row) => (
                          <tr key={row.productId} className="border-b border-border/60">
                            <td className="py-1.5 pr-2 font-mono text-xs">{row.sku}</td>
                            <td className="py-1.5 pr-2">{row.name}</td>
                            <td className="py-1.5 pr-2">{row.quantity}</td>
                            <td className="py-1.5 tabular-nums">
                              {cop.format(Number(row.total))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Top clientes</h3>
                  <div className="space-y-2">
                    {sales.topCustomers.map((row, i) => (
                      <div
                        key={row.customerId ?? `walkin-${i}`}
                        className="flex justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                      >
                        <span className="truncate">{row.name}</span>
                        <span className="shrink-0 tabular-nums font-medium">
                          {cop.format(Number(row.total))}{' '}
                          <span className="text-muted-foreground font-normal">
                            ({row.saleCount})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Detalle por período</h3>
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full min-w-[360px] text-sm text-left">
                    <thead>
                      <tr className="border-b text-muted-foreground sticky top-0 bg-card">
                        <th className="py-2 pr-4">Período</th>
                        <th className="py-2 pr-4">Cantidad</th>
                        <th className="py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.series.map((row) => (
                        <tr key={row.bucket} className="border-b border-border/60">
                          <td className="py-2 pr-4">{row.label}</td>
                          <td className="py-2 pr-4">{row.count}</td>
                          <td className="py-2 tabular-nums">{cop.format(Number(row.total))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {!sales && !loading && <p className="text-sm text-muted-foreground">Sin datos.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Compras</h2>
            {purchases && (
              <p className="text-sm text-muted-foreground mt-1">
                Recibidas en el rango · {purchases.meta.fromYmd} → {purchases.meta.toYmd}
              </p>
            )}
          </div>

          {purchases && (
            <>
              <SummaryGrid
                items={[
                  {
                    label: 'Total compras recibidas',
                    value: cop.format(Number(purchases.summary.totalAmount)),
                  },
                  {
                    label: 'Órdenes recibidas',
                    value: String(purchases.summary.purchaseCount),
                    hint: `Prom. ${cop.format(Number(purchases.summary.averagePurchase))}`,
                  },
                  {
                    label: 'Documentos en rango',
                    value: String(purchases.summary.allDocuments),
                    hint: 'Todos los estados',
                  },
                  {
                    label: 'IVA compras',
                    value: cop.format(Number(purchases.summary.taxTotalAmount)),
                  },
                ]}
              />

              {purchases.byStatus.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {purchases.byStatus.map((s) => (
                    <span
                      key={s.status}
                      className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs"
                    >
                      {PURCHASE_STATUS_LABEL[s.status] ?? s.status}: {s.count}
                    </span>
                  ))}
                </div>
              )}

              <ReportSeriesChart
                rows={purchases.series}
                granularity={purchases.meta.seriesGranularity}
              />

              {purchases.topSuppliers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Top proveedores</h3>
                  <div className="space-y-2">
                    {purchases.topSuppliers.map((row) => (
                      <div
                        key={row.supplierId}
                        className="flex justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                      >
                        <span>{row.name}</span>
                        <span className="shrink-0 tabular-nums font-medium">
                          {cop.format(Number(row.total))} ({row.purchaseCount})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {!purchases && !loading && (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Inventario (valor a costo)</h2>
            <p className="text-sm text-muted-foreground mt-1">Instantáneo · no depende del rango</p>
          </div>

          {inventory && (
            <>
              <SummaryGrid
                items={[
                  {
                    label: 'Valor total (costo)',
                    value: cop.format(Number(inventory.summary.totalValueAll)),
                  },
                  {
                    label: 'Unidades',
                    value: inventory.summary.totalUnits.toLocaleString('es-CO'),
                  },
                  {
                    label: 'Referencias activas',
                    value: String(inventory.summary.productCount),
                  },
                  {
                    label: 'Stock bajo',
                    value: String(inventory.summary.lowStockCount),
                  },
                ]}
              />
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full min-w-[640px] text-sm text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground sticky top-0 bg-card">
                      <th className="py-2 pr-2">SKU</th>
                      <th className="py-2 pr-2">Producto</th>
                      <th className="py-2 pr-2">Cant.</th>
                      <th className="py-2 pr-2">Costo</th>
                      <th className="py-2 pr-2">Valor costo</th>
                      <th className="py-2">Venta pot.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.lines.map((row) => (
                      <tr
                        key={row.productId}
                        className="border-b border-border/60"
                      >
                        <td className="py-1.5 pr-2 font-mono text-xs">{row.sku}</td>
                        <td className="py-1.5 pr-2">
                          {row.name}
                          {row.lowStock && (
                            <span className="ml-1 text-[10px] text-amber-600">bajo mín.</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-2">{row.quantity}</td>
                        <td className="py-1.5 pr-2 tabular-nums">
                          {cop.format(Number(row.unitCost))}
                        </td>
                        <td className="py-1.5 pr-2 tabular-nums font-medium">
                          {cop.format(Number(row.lineValue))}
                        </td>
                        <td className="py-1.5 tabular-nums text-muted-foreground">
                          {cop.format(Number(row.potentialSaleValue))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
