import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod, PurchaseStatus, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  bogotaDayBounds,
  bogotaDayBoundsFromYmd,
  bogotaDayStartDaysAgo,
  bogotaYmd,
} from '../../common/utils/bogota-date.util';
import { QueryReportsRangeDto } from './dto/query-reports-range.dto';
import { qtyToNumber } from '../../common/utils/product-quantity.util';

type SeriesGranularity = 'day' | 'week' | 'month';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function seriesGranularity(from: Date, to: Date): SeriesGranularity {
  const days = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;
  if (days > 120) return 'month';
  if (days > 45) return 'week';
  return 'day';
}

function weekStartYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  const dow = ref.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1;
  ref.setUTCDate(ref.getUTCDate() - diff);
  return ref.toISOString().slice(0, 10);
}

function bucketKeyForDate(d: Date, gran: SeriesGranularity): string {
  const ymd = bogotaYmd(d);
  if (gran === 'day') return ymd;
  if (gran === 'month') return ymd.slice(0, 7);
  return weekStartYmd(ymd);
}

function bucketLabel(key: string, gran: SeriesGranularity): string {
  if (gran === 'day') return key;
  if (gran === 'month') {
    const [y, m] = key.split('-');
    return `${m}/${y}`;
  }
  return `Sem. ${key.slice(8)}/${key.slice(5, 7)}`;
}

function buildSeries(
  entries: Array<{ date: Date; amount: number }>,
  gran: SeriesGranularity,
): Array<{ bucket: string; label: string; count: number; total: string }> {
  const map = new Map<string, { count: number; total: number }>();
  for (const e of entries) {
    const key = bucketKeyForDate(e.date, gran);
    const cur = map.get(key) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total = round2(cur.total + e.amount);
    map.set(key, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, v]) => ({
      bucket,
      label: bucketLabel(bucket, gran),
      count: v.count,
      total: v.total.toFixed(2),
    }));
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  MIXED: 'Mixto',
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveRange(query: QueryReportsRangeDto): {
    from: Date;
    to: Date;
    fromYmd: string;
    toYmd: string;
  } {
    const toBounds = query.to
      ? bogotaDayBoundsFromYmd(query.to)
      : bogotaDayBounds();
    const to = toBounds.end;
    const toYmd = query.to ?? bogotaYmd(new Date());

    const from = query.from
      ? bogotaDayBoundsFromYmd(query.from).start
      : bogotaDayStartDaysAgo(29);
    const fromYmd = query.from ?? bogotaYmd(from);

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException('La fecha "desde" debe ser anterior o igual a "hasta"');
    }
    const maxMs = 400 * 86400000;
    if (to.getTime() - from.getTime() > maxMs) {
      throw new BadRequestException('El rango máximo es 400 días (~13 meses)');
    }
    return { from, to, fromYmd, toYmd };
  }

  async salesByRange(query: QueryReportsRangeDto) {
    const { from, to, fromYmd, toYmd } = this.resolveRange(query);
    const gran = seriesGranularity(from, to);

    const [sales, cancelledCount, refundedCount] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          createdAt: { gte: from, lte: to },
        },
        include: {
          payments: true,
          items: {
            include: { product: { select: { id: true, sku: true, name: true } } },
          },
          customer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 50000,
      }),
      this.prisma.sale.count({
        where: { status: SaleStatus.CANCELLED, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.sale.count({
        where: { status: SaleStatus.REFUNDED, createdAt: { gte: from, lte: to } },
      }),
    ]);

    let sumTotal = 0;
    let sumSubtotal = 0;
    let sumTax = 0;
    let sumDiscount = 0;

    const paymentMap = new Map<PaymentMethod, { count: number; total: number }>();
    const productMap = new Map<
      string,
      { sku: string; name: string; quantity: number; total: number }
    >();
    const customerMap = new Map<
      string,
      { name: string; count: number; total: number }
    >();

    const seriesEntries: Array<{ date: Date; amount: number }> = [];

    for (const s of sales) {
      const t = Number(s.total);
      sumTotal += t;
      sumSubtotal += Number(s.subtotal);
      sumTax += Number(s.taxTotal);
      sumDiscount += Number(s.discountTotal);
      seriesEntries.push({ date: s.createdAt, amount: t });

      for (const p of s.payments) {
        const net =
          p.method === PaymentMethod.CASH
            ? round2(Number(p.amount) - Number(p.change))
            : Number(p.amount);
        const cur = paymentMap.get(p.method) ?? { count: 0, total: 0 };
        cur.count += 1;
        cur.total = round2(cur.total + net);
        paymentMap.set(p.method, cur);
      }

      for (const it of s.items) {
        const line = Number(it.subtotal);
        const cur = productMap.get(it.productId) ?? {
          sku: it.product.sku,
          name: it.product.name,
          quantity: 0,
          total: 0,
        };
        cur.quantity += qtyToNumber(it.quantity);
        cur.total = round2(cur.total + line);
        productMap.set(it.productId, cur);
      }

      const custKey = s.customerId ?? '__walkin__';
      const custName = s.customer?.name ?? 'Consumidor final';
      const cc = customerMap.get(custKey) ?? { name: custName, count: 0, total: 0 };
      cc.count += 1;
      cc.total = round2(cc.total + t);
      customerMap.set(custKey, cc);
    }

    const saleCount = sales.length;
    const series = buildSeries(seriesEntries, gran);

    const byPaymentMethod = [...paymentMap.entries()]
      .map(([method, v]) => ({
        method,
        label: PAYMENT_LABEL[method],
        count: v.count,
        total: v.total.toFixed(2),
      }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    const topProducts = [...productMap.entries()]
      .map(([productId, v]) => ({
        productId,
        sku: v.sku,
        name: v.name,
        quantity: v.quantity,
        total: v.total.toFixed(2),
      }))
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 15);

    const topCustomers = [...customerMap.entries()]
      .map(([customerId, v]) => ({
        customerId: customerId === '__walkin__' ? null : customerId,
        name: v.name,
        saleCount: v.count,
        total: v.total.toFixed(2),
      }))
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 10);

    return {
      meta: {
        timezone: 'America/Bogota',
        fromYmd,
        toYmd,
        seriesGranularity: gran,
      },
      from: from.toISOString(),
      to: to.toISOString(),
      summary: {
        saleCount,
        totalAmount: round2(sumTotal).toFixed(2),
        averageTicket: saleCount > 0 ? round2(sumTotal / saleCount).toFixed(2) : '0.00',
        subtotalAmount: round2(sumSubtotal).toFixed(2),
        taxTotalAmount: round2(sumTax).toFixed(2),
        discountTotalAmount: round2(sumDiscount).toFixed(2),
        cancelledCount,
        refundedCount,
      },
      series,
      daily: series,
      byPaymentMethod,
      topProducts,
      topCustomers,
    };
  }

  async purchasesByRange(query: QueryReportsRangeDto) {
    const { from, to, fromYmd, toYmd } = this.resolveRange(query);
    const gran = seriesGranularity(from, to);

    const purchases = await this.prisma.purchase.findMany({
      where: { date: { gte: from, lte: to } },
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
      take: 50000,
    });

    const received = purchases.filter((p) => p.status === PurchaseStatus.RECEIVED);
    let sumTotal = 0;
    let sumSubtotal = 0;
    let sumTax = 0;

    const statusCounts: Record<string, number> = {};
    const supplierMap = new Map<string, { name: string; count: number; total: number }>();
    const seriesEntries: Array<{ date: Date; amount: number }> = [];

    for (const p of purchases) {
      statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
      if (p.status !== PurchaseStatus.RECEIVED) continue;

      const t = Number(p.total);
      sumTotal += t;
      sumSubtotal += Number(p.subtotal);
      sumTax += Number(p.taxTotal);
      seriesEntries.push({ date: p.date, amount: t });

      const cur = supplierMap.get(p.supplierId) ?? {
        name: p.supplier.name,
        count: 0,
        total: 0,
      };
      cur.count += 1;
      cur.total = round2(cur.total + t);
      supplierMap.set(p.supplierId, cur);
    }

    const series = buildSeries(seriesEntries, gran);
    const topSuppliers = [...supplierMap.entries()]
      .map(([supplierId, v]) => ({
        supplierId,
        name: v.name,
        purchaseCount: v.count,
        total: v.total.toFixed(2),
      }))
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 10);

    return {
      meta: {
        timezone: 'America/Bogota',
        fromYmd,
        toYmd,
        seriesGranularity: gran,
      },
      from: from.toISOString(),
      to: to.toISOString(),
      summary: {
        purchaseCount: received.length,
        totalAmount: round2(sumTotal).toFixed(2),
        averagePurchase:
          received.length > 0 ? round2(sumTotal / received.length).toFixed(2) : '0.00',
        subtotalAmount: round2(sumSubtotal).toFixed(2),
        taxTotalAmount: round2(sumTax).toFixed(2),
        allDocuments: purchases.length,
      },
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      series,
      daily: series,
      topSuppliers,
    };
  }

  async inventoryValue(query: QueryReportsRangeDto) {
    const top = query.top ?? 20;
    const rows = await this.prisma.inventory.findMany({
      where: { product: { isActive: true } },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            costPrice: true,
            salePrice: true,
            minStock: true,
          },
        },
      },
    });

    const allLines = rows
      .map((r) => {
        const unitCost = Number(r.product.costPrice);
        const unitSale = Number(r.product.salePrice);
        const qty = qtyToNumber(r.quantity);
        const minS = qtyToNumber(r.product.minStock);
        const lineValue = round2(unitCost * qty);
        const lowStock = minS > 0 && qty < minS;
        return {
          productId: r.product.id,
          sku: r.product.sku,
          name: r.product.name,
          quantity: qty,
          minStock: minS,
          unitCost: unitCost.toFixed(2),
          unitSale: unitSale.toFixed(2),
          lineValue: lineValue.toFixed(2),
          potentialSaleValue: round2(unitSale * qty).toFixed(2),
          lowStock,
        };
      })
      .sort((a, b) => Number(b.lineValue) - Number(a.lineValue));

    const totalValueAll = round2(allLines.reduce((s, l) => s + Number(l.lineValue), 0));
    const totalUnits = allLines.reduce((s, l) => s + qtyToNumber(l.quantity), 0);
    const lowStockCount = allLines.filter((l) => l.lowStock).length;
    const lines = allLines.slice(0, top);

    return {
      top,
      summary: {
        productCount: allLines.length,
        totalUnits,
        totalValueAll: totalValueAll.toFixed(2),
        lowStockCount,
      },
      totalValueAll: totalValueAll.toFixed(2),
      lines,
    };
  }

  async exportSalesCsv(query: QueryReportsRangeDto): Promise<{ filename: string; body: string }> {
    const { from, to, fromYmd, toYmd } = this.resolveRange(query);
    const sales = await this.prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: { gte: from, lte: to },
      },
      select: {
        number: true,
        total: true,
        subtotal: true,
        taxTotal: true,
        discountTotal: true,
        createdAt: true,
        status: true,
        customer: { select: { name: true, documentNumber: true } },
        user: { select: { firstName: true, lastName: true } },
        payments: { select: { method: true, amount: true, change: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50000,
    });

    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = [
      'fecha',
      'numero_venta',
      'total',
      'subtotal',
      'iva',
      'descuento',
      'estado',
      'cliente',
      'documento',
      'vendedor',
      'pagos',
    ].join(',');
    const lines = sales.map((s) => {
      const payStr = s.payments
        .map((p) => {
          const net =
            p.method === PaymentMethod.CASH
              ? round2(Number(p.amount) - Number(p.change))
              : Number(p.amount);
          return `${p.method}:${net.toFixed(0)}`;
        })
        .join('|');
      return [
        s.createdAt.toISOString(),
        esc(s.number),
        Number(s.total).toFixed(2),
        Number(s.subtotal).toFixed(2),
        Number(s.taxTotal).toFixed(2),
        Number(s.discountTotal).toFixed(2),
        s.status,
        esc(s.customer?.name ?? ''),
        esc(s.customer?.documentNumber ?? ''),
        esc(`${s.user.firstName} ${s.user.lastName}`.trim()),
        esc(payStr),
      ].join(',');
    });

    return {
      filename: `ventas_${fromYmd}_${toYmd}.csv`,
      body: [header, ...lines].join('\n'),
    };
  }
}
