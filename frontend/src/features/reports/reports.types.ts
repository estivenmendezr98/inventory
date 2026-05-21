export interface ReportSeriesRow {
  bucket: string;
  label: string;
  count: number;
  total: string;
}

export interface SalesReport {
  meta: { timezone: string; fromYmd: string; toYmd: string; seriesGranularity: string };
  summary: {
    saleCount: number;
    totalAmount: string;
    averageTicket: string;
    subtotalAmount: string;
    taxTotalAmount: string;
    discountTotalAmount: string;
    cancelledCount: number;
    refundedCount: number;
  };
  series: ReportSeriesRow[];
  byPaymentMethod: Array<{ method: string; label: string; count: number; total: string }>;
  topProducts: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    total: string;
  }>;
  topCustomers: Array<{
    customerId: string | null;
    name: string;
    saleCount: number;
    total: string;
  }>;
}

export interface PurchasesReport {
  meta: { timezone: string; fromYmd: string; toYmd: string; seriesGranularity: string };
  summary: {
    purchaseCount: number;
    totalAmount: string;
    averagePurchase: string;
    subtotalAmount: string;
    taxTotalAmount: string;
    allDocuments: number;
  };
  byStatus: Array<{ status: string; count: number }>;
  series: ReportSeriesRow[];
  topSuppliers: Array<{
    supplierId: string;
    name: string;
    purchaseCount: number;
    total: string;
  }>;
}

export interface InventoryReport {
  top: number;
  summary: {
    productCount: number;
    totalUnits: number;
    totalValueAll: string;
    lowStockCount: number;
  };
  totalValueAll: string;
  lines: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    minStock: number;
    unitCost: string;
    unitSale: string;
    lineValue: string;
    potentialSaleValue: string;
    lowStock: boolean;
  }>;
}
