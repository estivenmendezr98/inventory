export interface DashboardSummary {
  meta: {
    salesPeriodLabel: string;
    generatedAt: string;
  };
  activeProducts: number;
  lowStockCount: number;
  lowStockItems: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    minStock: number;
  }>;
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
  recentSales?: Array<{ id: string; number: string; total: string; createdAt: string }>;
  cashSession?: {
    open: boolean;
    sessionId?: string;
    registerName?: string;
  };
  invoices?: {
    salesWithoutInvoice: number;
  };
}
