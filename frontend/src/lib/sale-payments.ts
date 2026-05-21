import { roundCop } from './money';
import { PAYMENT_METHOD_LABEL } from '../features/sales/saleStatus';

export interface PaymentLineInput {
  method: string;
  amount: number;
  change: number;
  reference: string;
}

export interface PaymentCustomerInfo {
  documentNumber: string;
  name: string;
}

/** Vuelto en efectivo: recibido menos lo que aplica a la venta (due). */
export function cashChangeFromReceived(received: number, due: number): number {
  if (due <= 0 || received < due) return 0;
  return roundCop(received - due);
}

export function paymentNet(p: Pick<PaymentLineInput, 'amount' | 'change'>): number {
  return roundCop(p.amount - (p.change || 0));
}

export function getRemainingDue(
  payments: PaymentLineInput[],
  saleTotal: number,
  excludeIdx?: number
): number {
  let net = 0;
  payments.forEach((p, i) => {
    if (excludeIdx !== undefined && i === excludeIdx) return;
    net += paymentNet(p);
  });
  return Math.max(0, roundCop(saleTotal - net));
}

export function buildSalePaymentReference(
  customer: PaymentCustomerInfo | undefined,
  method: string,
  saleTotal: number,
  received: number,
  change: number,
  lineCount: number
): string {
  const ts = new Date().toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const methodLabel = PAYMENT_METHOD_LABEL[method] ?? method;
  const customerLabel = customer
    ? `${customer.documentNumber} — ${customer.name}`
    : 'Contado';
  let text = `Venta manual | ${methodLabel} | ${customerLabel} | total ${saleTotal} | ${lineCount} líneas`;
  if (method === 'CASH') {
    text += ` | recibido ${received} | cambio ${change}`;
  }
  text += ` | ${ts}`;
  return text.slice(0, 120);
}

/** Calcula cambio, referencia y montos de tarjeta/transferencia en un solo paso (sin useEffect). */
export function resolveSalePayments(
  payments: PaymentLineInput[],
  total: number,
  customer: PaymentCustomerInfo | undefined,
  lineCount: number
): PaymentLineInput[] {
  let allocatedNet = 0;
  return payments.map((p) => {
    const due = Math.max(0, roundCop(total - allocatedNet));
    if (p.method === 'CASH') {
      const change = cashChangeFromReceived(p.amount, due);
      const net = paymentNet({ amount: p.amount, change });
      allocatedNet += net;
      return {
        ...p,
        change,
        reference: buildSalePaymentReference(
          customer,
          p.method,
          total,
          p.amount,
          change,
          lineCount
        ),
      };
    }
    const amount = payments.length === 1 ? total : p.amount;
    const row = { ...p, amount, change: 0 };
    allocatedNet += paymentNet(row);
    return {
      ...row,
      reference: buildSalePaymentReference(customer, p.method, total, amount, 0, lineCount),
    };
  });
}
