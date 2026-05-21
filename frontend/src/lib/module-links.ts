/** Rutas con query params para navegación entre módulos relacionados */

export type KardexSearchParams = {
  productId?: string;
  type?: 'IN' | 'OUT' | 'ADJUST';
  from?: string;
  to?: string;
  search?: string;
  referenceType?: string;
  referenceId?: string;
};

export function kardexPath(params?: KardexSearchParams): string {
  const q = new URLSearchParams();
  if (params?.productId) q.set('productId', params.productId);
  if (params?.type) q.set('type', params.type);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.search) q.set('search', params.search);
  if (params?.referenceType) q.set('referenceType', params.referenceType);
  if (params?.referenceId) q.set('referenceId', params.referenceId);
  const s = q.toString();
  return s ? `/kardex?${s}` : '/kardex';
}

export function purchasesPath(params?: {
  supplierId?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  open?: string;
}): string {
  const q = new URLSearchParams();
  if (params?.supplierId) q.set('supplierId', params.supplierId);
  if (params?.status) q.set('status', params.status);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.search) q.set('search', params.search);
  if (params?.open) q.set('open', params.open);
  const s = q.toString();
  return s ? `/purchases?${s}` : '/purchases';
}

export function salesPath(params?: {
  status?: string;
  customerId?: string;
  from?: string;
  to?: string;
  search?: string;
  open?: string;
}): string {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.customerId) q.set('customerId', params.customerId);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.search) q.set('search', params.search);
  if (params?.open) q.set('open', params.open);
  const s = q.toString();
  return s ? `/sales?${s}` : '/sales';
}

export function invoicesPath(openId?: string): string {
  return openId ? `/invoices?open=${openId}` : '/invoices';
}

/** Vuelve a abrir «Ajustar venta» en el turno de caja tras anular en facturación. */
export type SaleAdjustReturn = {
  sessionId: string;
  adjustSale: string;
};

export function parseSaleAdjustReturn(searchParams: URLSearchParams): SaleAdjustReturn | null {
  if (searchParams.get('returnTo') !== 'sale-adjust') return null;
  const sessionId = searchParams.get('sessionId')?.trim();
  const adjustSale = searchParams.get('adjustSale')?.trim();
  if (!sessionId || !adjustSale) return null;
  return { sessionId, adjustSale };
}

export function invoicesPathForSaleAdjustment(ctx: {
  invoiceId: string;
  sessionId: string;
  saleId: string;
}): string {
  const q = new URLSearchParams({
    open: ctx.invoiceId,
    returnTo: 'sale-adjust',
    sessionId: ctx.sessionId,
    adjustSale: ctx.saleId,
  });
  return `/invoices?${q}`;
}

export function cashSessionSaleAdjustPath(sessionId: string, saleId: string): string {
  const q = new URLSearchParams({ adjustSale: saleId, tab: 'ventas' });
  return `/cash-register/sessions/${sessionId}?${q}`;
}

export type ReferenceLink =
  | { kind: 'sale'; id: string; label: string }
  | { kind: 'purchase'; id: string; label: string }
  | { kind: 'none'; label: string };

export function resolveKardexReference(
  referenceType: string | null,
  referenceId: string | null
): ReferenceLink {
  if (!referenceType || !referenceId) {
    return { kind: 'none', label: 'Ajuste manual' };
  }
  if (referenceType === 'Sale') {
    return { kind: 'sale', id: referenceId, label: 'Ver venta' };
  }
  if (referenceType === 'Purchase') {
    return { kind: 'purchase', id: referenceId, label: 'Ver compra' };
  }
  return { kind: 'none', label: referenceType };
}

export function referencePath(ref: ReferenceLink): string | null {
  if (ref.kind === 'sale') return salesPath({ open: ref.id });
  if (ref.kind === 'purchase') return purchasesPath({ open: ref.id });
  return null;
}
