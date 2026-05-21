import type { ThermalReceiptPayload } from './thermal-receipt-types';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function thermalColumns(pageSize: '58mm' | '80mm'): number {
  return pageSize === '58mm' ? 32 : 48;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)) + '…';
}

function padLine(left: string, right: string, cols: number): string {
  const gap = cols - left.length - right.length;
  if (gap >= 1) return left + ' '.repeat(gap) + right;
  return truncate(left, cols - right.length - 1) + ' ' + right;
}

function divider(cols: number): string {
  return '='.repeat(cols);
}

function dashLine(cols: number): string {
  return '-'.repeat(cols);
}

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro',
};

/** Genera líneas de texto monoespaciado para ticket térmico. */
export function buildThermalReceiptLines(data: ThermalReceiptPayload): string[] {
  const cols = thermalColumns(data.template.pageSize);
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);
  const center = (s: string) => {
    const t = truncate(s, cols);
    const pad = Math.max(0, Math.floor((cols - t.length) / 2));
    push(' '.repeat(pad) + t);
  };

  center(data.company.name);
  if (data.company.taxId) push(`NIT: ${truncate(data.company.taxId, cols - 5)}`);
  if (data.company.address) {
    for (const part of data.company.address.split(/\n+/)) {
      push(truncate(part.trim(), cols));
    }
  }
  if (data.company.phone) push(truncate(`Tel: ${data.company.phone}`, cols));

  const dt = new Date(data.receipt.date);
  push(
    `Fecha: ${dt.toLocaleDateString('es-CO')} ${dt.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
  );
  push(`Ticket: ${data.receipt.fullNumber}`);
  if (data.receipt.displayStatus === 'Anulado') {
    center('*** ANULADO ***');
  }
  if (data.receipt.customerName) {
    push(truncate(`Cliente: ${data.receipt.customerName}`, cols));
  }
  if (data.receipt.customerDoc) {
    push(truncate(`Doc: ${data.receipt.customerDoc}`, cols));
  }

  push(divider(cols));

  for (const it of data.receipt.items) {
    const qtyPart = `${it.quantity}x`;
    const namePart = truncate(it.name, cols - qtyPart.length - 12);
    const pricePart = cop.format(it.subtotal);
    push(padLine(`${qtyPart} ${namePart}`, pricePart, cols));
    const unitLine = `${it.unitSymbol} · ${cop.format(it.unitPrice)}/${it.unitSymbol}`;
    if (data.template.showItemSku && it.sku) {
      push(truncate(`   ${it.sku} · ${unitLine}`, cols));
    } else {
      push(truncate(`   ${unitLine}`, cols));
    }
  }

  push(divider(cols));

  if (data.template.showSubtotal) {
    push(padLine('Subtotal:', cop.format(data.receipt.subtotal), cols));
  }
  if (data.template.showTax && data.receipt.taxTotal > 0) {
    push(padLine('IVA:', cop.format(data.receipt.taxTotal), cols));
  }
  push(padLine('TOTAL:', cop.format(data.receipt.total), cols));

  push(divider(cols));

  for (const p of data.receipt.payments) {
    const label = PAYMENT_LABEL[p.method] ?? p.method;
    push(padLine(label + ':', cop.format(p.amount - p.change), cols));
    if (p.method === 'CASH' && p.change > 0) {
      push(padLine('Cambio:', cop.format(p.change), cols));
    }
  }

  if (data.template.footerText) {
    push(dashLine(cols));
    for (const part of data.template.footerText.split(/\n+/)) {
      const t = part.trim();
      if (t) center(t);
    }
  }

  push(dashLine(cols));
  return lines;
}
