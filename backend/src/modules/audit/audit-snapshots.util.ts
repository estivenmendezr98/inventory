import { Prisma } from '@prisma/client';
import { qtyToNumber } from '../../common/utils/product-quantity.util';

/** Serializa valores Prisma/Date para JSON de auditoría. */
export function auditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (v === null || v === undefined) return v;
      if (typeof v === 'bigint') return v.toString();
      if (v instanceof Prisma.Decimal) return v.toString();
      if (v instanceof Date) return v.toISOString();
      return v;
    }),
  ) as Prisma.InputJsonValue;
}

export function decimalStr(v: Prisma.Decimal | number | string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Prisma.Decimal) return v.toString();
  return String(v);
}

type SaleItemRow = {
  id: string;
  productId: string;
  quantity: number | Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  discount?: Prisma.Decimal | null;
  taxRate?: number | Prisma.Decimal | null;
  subtotal?: Prisma.Decimal | null;
  product?: { sku: string; name: string } | null;
};

type SalePaymentRow = {
  method: string;
  amount: Prisma.Decimal;
  reference?: string | null;
  change?: number | Prisma.Decimal | null;
};

export function snapshotSaleItems(items: SaleItemRow[]) {
  return items.map((it) => ({
    saleItemId: it.id,
    productId: it.productId,
    sku: it.product?.sku ?? null,
    productName: it.product?.name ?? null,
    quantity: qtyToNumber(it.quantity),
    unitPrice: decimalStr(it.unitPrice),
    discount: decimalStr(it.discount ?? null),
    taxRate:
      it.taxRate === null || it.taxRate === undefined
        ? null
        : it.taxRate instanceof Prisma.Decimal
          ? it.taxRate.toString()
          : it.taxRate,
    lineSubtotal: decimalStr(it.subtotal ?? null),
  }));
}

export function snapshotSalePayments(payments: SalePaymentRow[]) {
  return payments.map((p) => ({
    method: p.method,
    amount: decimalStr(p.amount),
    reference: p.reference ?? null,
    change: decimalStr(p.change ?? 0),
  }));
}

export function snapshotSaleHeader(sale: {
  id: string;
  number: string;
  status: string;
  subtotal: Prisma.Decimal;
  discountTotal?: Prisma.Decimal;
  taxTotal: Prisma.Decimal;
  total: Prisma.Decimal;
  customerId?: string | null;
  cashSessionId?: string | null;
  paidAt?: Date | null;
  customer?: {
    id: string;
    name: string;
    documentType?: string;
    documentNumber?: string;
  } | null;
  invoice?: { id: string; prefix: string; number: number; status: string } | null;
}) {
  return {
    saleId: sale.id,
    saleNumber: sale.number,
    status: sale.status,
    subtotal: decimalStr(sale.subtotal),
    discountTotal: decimalStr(sale.discountTotal ?? null),
    taxTotal: decimalStr(sale.taxTotal),
    total: decimalStr(sale.total),
    customerId: sale.customerId ?? null,
    customerName: sale.customer?.name ?? null,
    customerDocument: sale.customer
      ? `${sale.customer.documentType ?? ''} ${sale.customer.documentNumber ?? ''}`.trim()
      : null,
    cashSessionId: sale.cashSessionId ?? null,
    paidAt: sale.paidAt?.toISOString() ?? null,
    invoice: sale.invoice
      ? {
          id: sale.invoice.id,
          fullNumber: `${sale.invoice.prefix}-${sale.invoice.number}`,
          status: sale.invoice.status,
        }
      : null,
  };
}

export function snapshotProduct(p: {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  unitOfMeasureId?: string;
  measureDetail?: string | null;
  costPrice: Prisma.Decimal;
  salePrice: Prisma.Decimal;
  taxRate?: number | Prisma.Decimal;
  minStock?: number | Prisma.Decimal;
  maxStock?: number | Prisma.Decimal;
  isActive?: boolean;
  category?: { id: string; name: string } | null;
  unitOfMeasure?: { code: string; name: string; symbol: string } | null;
  inventory?: Array<{ quantity: number | Prisma.Decimal; reservedQty: number | Prisma.Decimal }>;
}) {
  const inv = p.inventory?.[0];
  return {
    productId: p.id,
    sku: p.sku,
    barcode: p.barcode ?? null,
    name: p.name,
    description: p.description ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: p.category?.name ?? null,
    unitOfMeasureId: p.unitOfMeasureId ?? null,
    unitCode: p.unitOfMeasure?.code ?? null,
    unitName: p.unitOfMeasure?.name ?? null,
    unitSymbol: p.unitOfMeasure?.symbol ?? null,
    measureDetail: p.measureDetail ?? null,
    costPrice: decimalStr(p.costPrice),
    salePrice: decimalStr(p.salePrice),
    taxRate:
      p.taxRate === null || p.taxRate === undefined
        ? null
        : p.taxRate instanceof Prisma.Decimal
          ? p.taxRate.toString()
          : p.taxRate,
    minStock:
      p.minStock === null || p.minStock === undefined
        ? null
        : p.minStock instanceof Prisma.Decimal
          ? p.minStock.toString()
          : String(p.minStock),
    maxStock:
      p.maxStock === null || p.maxStock === undefined
        ? null
        : p.maxStock instanceof Prisma.Decimal
          ? p.maxStock.toString()
          : String(p.maxStock),
    isActive: p.isActive ?? true,
    stockQty: inv?.quantity != null ? decimalStr(inv.quantity as Prisma.Decimal) : null,
    reservedQty: inv?.reservedQty != null ? decimalStr(inv.reservedQty as Prisma.Decimal) : null,
  };
}

export function snapshotInvoice(inv: {
  id: string;
  saleId?: string | null;
  prefix: string;
  number: number;
  status: string;
  subtotal: Prisma.Decimal;
  taxTotal: Prisma.Decimal;
  total: Prisma.Decimal;
  customerName?: string | null;
  customerDoc?: string | null;
  cufe?: string | null;
  electronicTrackId?: string | null;
}) {
  return {
    invoiceId: inv.id,
    saleId: inv.saleId ?? null,
    fullNumber: `${inv.prefix}-${inv.number}`,
    status: inv.status,
    subtotal: decimalStr(inv.subtotal),
    taxTotal: decimalStr(inv.taxTotal),
    total: decimalStr(inv.total),
    customerName: inv.customerName ?? null,
    customerDoc: inv.customerDoc ?? null,
    cufe: inv.cufe ?? null,
    electronicTrackId: inv.electronicTrackId ?? null,
  };
}

export function snapshotPurchase(p: {
  id: string;
  number: string;
  status: string;
  supplierId: string;
  date: Date;
  subtotal: Prisma.Decimal;
  taxTotal: Prisma.Decimal;
  total: Prisma.Decimal;
  notes?: string | null;
  items?: Array<{
    productId: string;
    quantity: number | Prisma.Decimal;
    unitCost: Prisma.Decimal;
    taxRate: number | Prisma.Decimal;
    subtotal: Prisma.Decimal;
    product?: { sku: string; name: string } | null;
  }>;
  supplier?: { id: string; name: string } | null;
}) {
  return {
    purchaseId: p.id,
    purchaseNumber: p.number,
    status: p.status,
    supplierId: p.supplierId,
    supplierName: p.supplier?.name ?? null,
    date: p.date.toISOString().slice(0, 10),
    subtotal: decimalStr(p.subtotal),
    taxTotal: decimalStr(p.taxTotal),
    total: decimalStr(p.total),
    notes: p.notes ?? null,
    items: (p.items ?? []).map((it) => ({
      productId: it.productId,
      sku: it.product?.sku ?? null,
      productName: it.product?.name ?? null,
      quantity: qtyToNumber(it.quantity),
      unitCost: decimalStr(it.unitCost),
      taxRate:
        it.taxRate instanceof Prisma.Decimal ? it.taxRate.toString() : it.taxRate,
      lineSubtotal: decimalStr(it.subtotal),
    })),
  };
}

export function snapshotCashSession(s: {
  id: string;
  cashRegisterId: string;
  userId: string;
  status: string;
  openingAmount: Prisma.Decimal;
  closingAmount?: Prisma.Decimal | null;
  expectedAmount?: Prisma.Decimal | null;
  difference?: Prisma.Decimal | null;
  openedAt?: Date;
  closedAt?: Date | null;
  cashRegister?: { name: string } | null;
}) {
  return {
    sessionId: s.id,
    cashRegisterId: s.cashRegisterId,
    cashRegisterName: s.cashRegister?.name ?? null,
    userId: s.userId,
    status: s.status,
    openingAmount: decimalStr(s.openingAmount),
    closingAmount: decimalStr(s.closingAmount ?? null),
    expectedAmount: decimalStr(s.expectedAmount ?? null),
    difference: decimalStr(s.difference ?? null),
    openedAt: s.openedAt?.toISOString() ?? null,
    closedAt: s.closedAt?.toISOString() ?? null,
  };
}

export function snapshotParty(entity: {
  id: string;
  name: string;
  documentType?: string;
  documentNumber?: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
}) {
  return {
    id: entity.id,
    name: entity.name,
    documentType: entity.documentType ?? null,
    documentNumber: entity.documentNumber ?? null,
    email: entity.email ?? null,
    phone: entity.phone ?? null,
    isActive: entity.isActive ?? true,
  };
}

export function snapshotSettingsChanges(
  entries: Array<{ key: string; value: string }>,
  previous: Map<string, string>,
) {
  return entries.map((e) => ({
    key: e.key,
    oldValue: previous.get(e.key) ?? null,
    newValue: e.value,
  }));
}
