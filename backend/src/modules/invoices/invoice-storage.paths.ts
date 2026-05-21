import { mkdirSync } from 'node:fs';
import * as path from 'node:path';

export function resolveInvoiceStorageDir(): string {
  const raw = process.env.INVOICE_STORAGE_PATH || 'storage/invoices';
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export function ensureInvoiceStorageDir(): string {
  const dir = resolveInvoiceStorageDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function invoiceLocalPath(dir: string, invoiceId: string, ext: 'pdf' | 'xml'): string {
  return path.join(dir, `${invoiceId}.${ext}`);
}
