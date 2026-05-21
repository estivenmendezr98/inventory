import { InvoiceStatus } from '@prisma/client';
import type { InvoiceTemplateConfig } from './invoice-template.config';

export type ThermalReceiptPayload = {
  company: {
    name: string;
    taxId: string;
    address: string;
    phone: string;
  };
  template: {
    pageSize: '58mm' | '80mm';
    showItemSku: boolean;
    showSubtotal: boolean;
    showTax: boolean;
    footerText: string;
    footerNote: string;
    showSimplifiedRegimeLine: boolean;
    previewBeforePrint: boolean;
    printerHint: string;
    openCashDrawer: boolean;
  };
  receipt: {
    id: string;
    fullNumber: string;
    displayStatus: 'Activo' | 'Anulado';
    date: string;
    customerName: string | null;
    customerDoc: string | null;
    items: Array<{
      sku: string;
      name: string;
      quantity: number;
      unitSymbol: string;
      unitPrice: number;
      subtotal: number;
      taxRate: number;
    }>;
    subtotal: number;
    taxTotal: number;
    total: number;
    payments: Array<{ method: string; amount: number; change: number }>;
  };
};

const SIMPLIFIED_LINE =
  'No requiere factura electrónica – comprobante válido para el cliente';

export function thermalDisplayStatus(status: InvoiceStatus): 'Activo' | 'Anulado' {
  if (status === InvoiceStatus.CANCELLED || status === InvoiceStatus.VOIDED) {
    return 'Anulado';
  }
  return 'Activo';
}

export function normalizeTicketPageSize(
  pageSize: InvoiceTemplateConfig['pageSize'],
): '58mm' | '80mm' {
  return pageSize === '58mm' ? '58mm' : '80mm';
}

export function buildThermalReceiptPayload(input: {
  invoice: {
    id: string;
    prefix: string;
    number: number;
    date: Date;
    status: InvoiceStatus;
    subtotal: { toString(): string };
    taxTotal: { toString(): string };
    total: { toString(): string };
    customerName: string | null;
    customerDoc: string | null;
    sale: {
      payments: Array<{
        method: string;
        amount: { toString(): string };
        change: { toString(): string };
      }>;
      items: Array<{
        quantity: { toString(): string };
        unitPrice: { toString(): string };
        subtotal: { toString(): string };
        taxRate: { toString(): string };
        product: { sku: string; name: string };
        saleUnit: { symbol: string } | null;
      }>;
    };
  };
  company: { name: string; taxId: string; address: string; phone: string };
  footerNote: string;
  template: InvoiceTemplateConfig;
}): ThermalReceiptPayload {
  const tpl = input.template;
  const pageSize = normalizeTicketPageSize(tpl.pageSize);
  const footerParts: string[] = [];
  if (tpl.footerText.trim()) footerParts.push(tpl.footerText.trim());
  if (tpl.appendFooterNote && input.footerNote.trim()) {
    footerParts.push(input.footerNote.trim());
  }
  if (tpl.showSimplifiedRegimeLine) footerParts.push(SIMPLIFIED_LINE);

  return {
    company: input.company,
    template: {
      pageSize,
      showItemSku: tpl.showItemSku,
      showSubtotal: tpl.showSubtotal,
      showTax: tpl.showTax,
      footerText: footerParts.join('\n'),
      footerNote: input.footerNote,
      showSimplifiedRegimeLine: tpl.showSimplifiedRegimeLine,
      previewBeforePrint: tpl.previewBeforePrint,
      printerHint: tpl.printerHint,
      openCashDrawer: tpl.openCashDrawer,
    },
    receipt: {
      id: input.invoice.id,
      fullNumber: `${input.invoice.prefix}-${input.invoice.number}`,
      displayStatus: thermalDisplayStatus(input.invoice.status),
      date: input.invoice.date.toISOString(),
      customerName: input.invoice.customerName,
      customerDoc: input.invoice.customerDoc,
      items: input.invoice.sale.items.map((it) => ({
        sku: it.product.sku,
        name: it.product.name,
        quantity: Number(it.quantity),
        unitSymbol: it.saleUnit?.symbol ?? 'und',
        unitPrice: Number(it.unitPrice),
        subtotal: Number(it.subtotal),
        taxRate: Number(it.taxRate),
      })),
      subtotal: Number(input.invoice.subtotal),
      taxTotal: Number(input.invoice.taxTotal),
      total: Number(input.invoice.total),
      payments: input.invoice.sale.payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
        change: Number(p.change),
      })),
    },
  };
}

export function buildThermalReceiptSample(
  company: { name: string; taxId: string; address: string; phone: string },
  template: InvoiceTemplateConfig,
  footerNote: string,
): ThermalReceiptPayload {
  const now = new Date();
  return buildThermalReceiptPayload({
    company,
    footerNote,
    template,
    invoice: {
      id: '00000000-0000-0000-0000-000000000000',
      prefix: 'TKT',
      number: 1,
      date: now,
      status: InvoiceStatus.ACTIVE,
      subtotal: { toString: () => '5000' },
      taxTotal: { toString: () => '950' },
      total: { toString: () => '5950' },
      customerName: 'Cliente de prueba',
      customerDoc: null,
      sale: {
        payments: [{ method: 'CASH', amount: { toString: () => '10000' }, change: { toString: () => '4050' } }],
        items: [
          {
            quantity: { toString: () => '1' },
            unitPrice: { toString: () => '3000' },
            subtotal: { toString: () => '3000' },
            taxRate: { toString: () => '19' },
            product: { sku: 'GO4', name: 'Go 4' },
            saleUnit: { symbol: 'und' },
          },
          {
            quantity: { toString: () => '2' },
            unitPrice: { toString: () => '1000' },
            subtotal: { toString: () => '2000' },
            taxRate: { toString: () => '19' },
            product: { sku: 'LIJA1', name: 'Lija general' },
            saleUnit: { symbol: 'und' },
          },
        ],
      },
    },
  });
}
