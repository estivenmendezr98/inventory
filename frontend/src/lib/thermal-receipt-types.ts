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
