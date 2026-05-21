import { Injectable } from '@nestjs/common';
import { qtyToNumber } from '../../common/utils/product-quantity.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { CashSessionStatus, PurchaseStatus, SaleStatus } from '@prisma/client';
import {
  bogotaDayBounds,
  bogotaDayStartDaysAgo,
  bogotaYesterdayBounds,
} from '../../common/utils/bogota-date.util';

export interface DashboardLowStockItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
}

export interface DashboardRecentSale {
  id: string;
  number: string;
  total: string;
  createdAt: string;
}

export interface DashboardSummary {
  meta: {
    salesPeriodLabel: string;
    generatedAt: string;
  };
  activeProducts: number;
  lowStockCount: number;
  lowStockItems: DashboardLowStockItem[];
  salesTodayCount: number;
  salesTodayTotal: string;
  salesYesterdayTotal: string;
  newCustomersWeek: number;
  analytics?: {
    purchasesPending: number;
    inventoryValueEstimate: string;
    salesWeekCount: number;
    salesWeekTotal: string;
  };
  recentSales?: DashboardRecentSale[];
  cashSession?: {
    open: boolean;
    sessionId?: string;
    registerName?: string;
  };
  invoices?: {
    salesWithoutInvoice: number;
  };
}

const CASH_PERMS = ['cash_register.open', 'cash_register.close', 'cash_register.movement'] as const;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getSummaryForUser(userId: string): Promise<DashboardSummary> {
    const permissions = await this.authService.getUserPermissions(userId);
    const includeAnalytics = permissions.includes('dashboard.view_analytics');
    const includeRecentSales = permissions.includes('sales.view');
    const includeCash = CASH_PERMS.some((p) => permissions.includes(p));
    const includeInvoices = permissions.includes('invoices.view');

    const { start: todayStart, end: todayEnd } = bogotaDayBounds();
    const { start: yesterdayStart, end: yesterdayEnd } = bogotaYesterdayBounds();
    const weekStart = bogotaDayStartDaysAgo(6);

    const [
      activeProducts,
      inventories,
      salesTodayAgg,
      salesYesterdayAgg,
      newCustomersWeek,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.inventory.findMany({
        where: { product: { isActive: true } },
        select: {
          quantity: true,
          product: { select: { id: true, name: true, sku: true, minStock: true } },
        },
      }),
      this.prisma.sale.aggregate({
        where: {
          status: SaleStatus.COMPLETED,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        _count: true,
        _sum: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: {
          status: SaleStatus.COMPLETED,
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        },
        _sum: { total: true },
      }),
      this.prisma.customer.count({
        where: { createdAt: { gte: weekStart }, isActive: true },
      }),
    ]);

    const lowStockRows = inventories.filter((i) => {
      const minS = qtyToNumber(i.product.minStock);
      return minS > 0 && qtyToNumber(i.quantity) < minS;
    });
    const lowStockItems: DashboardLowStockItem[] = [...lowStockRows]
      .sort((a, b) => qtyToNumber(a.quantity) - qtyToNumber(b.quantity))
      .slice(0, 10)
      .map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        sku: i.product.sku,
        quantity: qtyToNumber(i.quantity),
        minStock: qtyToNumber(i.product.minStock),
      }));

    const summary: DashboardSummary = {
      meta: {
        salesPeriodLabel: 'Hoy (hora Colombia)',
        generatedAt: new Date().toISOString(),
      },
      activeProducts,
      lowStockCount: lowStockRows.length,
      lowStockItems,
      salesTodayCount: salesTodayAgg._count,
      salesTodayTotal: salesTodayAgg._sum.total?.toString() ?? '0',
      salesYesterdayTotal: salesYesterdayAgg._sum.total?.toString() ?? '0',
      newCustomersWeek,
    };

    if (includeAnalytics) {
      const [purchasesPending, invRows, salesWeekAgg] = await Promise.all([
        this.prisma.purchase.count({
          where: { status: { in: [PurchaseStatus.DRAFT, PurchaseStatus.ORDERED] } },
        }),
        this.prisma.inventory.findMany({
          include: { product: { select: { costPrice: true } } },
        }),
        this.prisma.sale.aggregate({
          where: {
            status: SaleStatus.COMPLETED,
            createdAt: { gte: weekStart, lte: todayEnd },
          },
          _count: true,
          _sum: { total: true },
        }),
      ]);
      const inventoryValueEstimate = invRows
        .reduce((sum, r) => sum + qtyToNumber(r.quantity) * Number(r.product.costPrice), 0)
        .toFixed(2);

      summary.analytics = {
        purchasesPending,
        inventoryValueEstimate,
        salesWeekCount: salesWeekAgg._count,
        salesWeekTotal: salesWeekAgg._sum.total?.toString() ?? '0',
      };
    }

    if (includeRecentSales) {
      const recent = await this.prisma.sale.findMany({
        where: { status: SaleStatus.COMPLETED },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, number: true, total: true, createdAt: true },
      });
      summary.recentSales = recent.map((s) => ({
        id: s.id,
        number: s.number,
        total: s.total.toString(),
        createdAt: s.createdAt.toISOString(),
      }));
    }

    if (includeCash) {
      const open = await this.prisma.cashSession.findFirst({
        where: { userId, status: CashSessionStatus.OPEN },
        include: { cashRegister: { select: { name: true } } },
      });
      summary.cashSession = open
        ? {
            open: true,
            sessionId: open.id,
            registerName: open.cashRegister.name,
          }
        : { open: false };
    }

    if (includeInvoices) {
      const salesWithoutInvoice = await this.prisma.sale.count({
        where: { status: SaleStatus.COMPLETED, invoice: null },
      });
      summary.invoices = { salesWithoutInvoice };
    }

    return summary;
  }
}
