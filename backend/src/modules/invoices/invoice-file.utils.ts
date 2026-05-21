/** Nombre seguro para cabecera Content-Disposition (ASCII, sin rutas). */
export function safeInvoiceAttachmentName(name: string): string {
  const base = name.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 180);
  return base || 'factura';
}

export function invoiceDownloadApiPath(invoiceId: string, kind: 'pdf' | 'xml'): string {
  return `/api/invoices/${invoiceId}/files/${kind}`;
}
