import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';
import { qtyToNumber } from '../../common/utils/product-quantity.util';
import { MinioStorageService } from '../../common/storage/minio-storage.service';
import { ensureInvoiceStorageDir, invoiceLocalPath } from './invoice-storage.paths';
import { invoiceDownloadApiPath } from './invoice-file.utils';
import {
  mmToPt,
  pdfDocSize,
  type InvoiceTemplateConfig,
} from './invoice-template.config';
import { InvoiceTemplateConfigService } from './invoice-template-config.service';
import { TicketIssuerService, type TicketCompanyInfo } from './ticket-issuer.service';
import { resolveBrandingStorageDir } from '../settings/settings.paths';
import { COMPANY_LOGO_SETTING_KEY } from '../settings/company-logo.constants';
import { roundCop } from '../../common/utils/cop-money.util';
import type { PaymentMethod } from '@prisma/client';

type InvoiceWithSale = Prisma.InvoiceGetPayload<{
  include: {
    sale: {
      include: {
        customer: true;
        payments: { orderBy: { createdAt: 'asc' } };
        items: {
          include: { product: { select: { sku: true; name: true } } };
          orderBy: { id: 'asc' };
        };
      };
    };
  };
}>;

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  MIXED: 'Mixto',
};

function dec(n: { toString(): string }): number {
  return Number(n.toString());
}

function formatCop(n: number): string {
  return roundCop(n).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

@Injectable()
export class InvoiceArtifactsService {
  private readonly logger = new Logger(InvoiceArtifactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioStorageService,
    private readonly templateConfig: InvoiceTemplateConfigService,
    private readonly ticketIssuer: TicketIssuerService,
  ) {}

  async buildPreviewPdf(): Promise<Buffer> {
    const company = await this.ticketIssuer.resolve();
    const tpl = await this.templateConfig.get();
    const footerNote = tpl.appendFooterNote ? await this.templateConfig.resolveFooterNote() : '';
    const sampleDate = new Date();
    const mockInv = {
      id: 'preview',
      prefix: 'TKT',
      number: 1,
      resolutionNumber: '',
      date: sampleDate,
      subtotal: new Prisma.Decimal(100000),
      taxTotal: new Prisma.Decimal(19000),
      total: new Prisma.Decimal(119000),
      customerName: 'Cliente de ejemplo',
      customerDoc: 'CC 1234567890',
      sale: {
        customer: { documentType: 'CC' as const, documentNumber: '1234567890' },
        payments: [
          {
            method: 'CASH' as const,
            amount: new Prisma.Decimal(150000),
            change: new Prisma.Decimal(31000),
          },
        ],
        items: [
          {
            quantity: 2,
            subtotal: new Prisma.Decimal(80000),
            product: { sku: 'SKU-001', name: 'Producto demostración A' },
          },
          {
            quantity: 1,
            subtotal: new Prisma.Decimal(20000),
            product: { sku: 'SKU-002', name: 'Producto demostración B' },
          },
        ],
      },
    } as unknown as NonNullable<InvoiceWithSale>;
    return this.buildPdf(mockInv, company, tpl, footerNote);
  }

  async attachToInvoice(invoiceId: string, options?: { force?: boolean }): Promise<void> {
    const inv = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        sale: {
          include: {
            customer: true,
            payments: { orderBy: { createdAt: 'asc' } },
            items: {
              include: { product: { select: { sku: true, name: true } } },
              orderBy: { id: 'asc' },
            },
          },
        },
      },
    });
    if (!inv) {
      throw new NotFoundException(`Comprobante ${invoiceId} no encontrado al generar PDF`);
    }

    const dir = ensureInvoiceStorageDir();
    const pdfPath = invoiceLocalPath(dir, inv.id, 'pdf');
    const forceRegenerate =
      options?.force === true ||
      process.env.INVOICE_FORCE_REGENERATE_ARTIFACTS === '1' ||
      process.env.INVOICE_FORCE_REGENERATE_ARTIFACTS === 'true';

    if (!forceRegenerate && inv.pdfUrl) {
      try {
        await access(pdfPath, constants.R_OK);
        this.logger.debug(`PDF ya presente para comprobante ${invoiceId}.`);
        return;
      } catch {
        this.logger.warn(`Comprobante ${invoiceId} sin archivo PDF; se regenera.`);
      }
    }

    const company = await this.ticketIssuer.resolve();
    const tpl = await this.templateConfig.get();
    const footerNote = tpl.appendFooterNote ? await this.templateConfig.resolveFooterNote() : '';
    const pdfBuf = await this.buildPdf(inv, company, tpl, footerNote);
    await writeFile(pdfPath, pdfBuf);

    if (this.minio.isEnabled()) {
      try {
        await this.minio.putBuffer(
          this.minio.objectKey(inv.id, 'pdf'),
          pdfBuf,
          'application/pdf',
        );
      } catch (e) {
        this.logger.warn(`MinIO comprobante ${inv.id}: ${e instanceof Error ? e.message : e}`);
      }
    }

    await this.prisma.invoice.update({
      where: { id: inv.id },
      data: {
        pdfUrl: invoiceDownloadApiPath(inv.id, 'pdf'),
        xmlUrl: null,
        electronicTrackId: null,
        cufe: null,
        qrPayload: null,
      },
    });
  }

  private async resolveLogoPath(): Promise<string | null> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: COMPANY_LOGO_SETTING_KEY },
    });
    if (!row?.value?.trim()) return null;
    try {
      const meta = JSON.parse(row.value) as { filename?: string };
      if (!meta.filename) return null;
      const abs = path.join(resolveBrandingStorageDir(), meta.filename);
      await access(abs, constants.R_OK);
      return abs;
    } catch {
      return null;
    }
  }

  private drawPaymentsSection(
    doc: InstanceType<typeof PDFDocument>,
    payments: InvoiceWithSale['sale']['payments'],
    contentW: number,
    left: number,
    tpl: InvoiceTemplateConfig,
    ensureSpace: (neededPt: number) => void,
  ): void {
    if (!payments.length) return;

    let blockH = 28;
    for (const p of payments) {
      blockH += p.method === 'CASH' ? 36 : 18;
    }
    ensureSpace(blockH);

    doc.moveDown(0.55);
    doc.fontSize(tpl.fontSizeBody).font('Helvetica-Bold').fillColor(tpl.textColor);
    doc.text('Forma de pago', left, doc.y, { width: contentW });
    doc.moveDown(0.35);
    doc.font('Helvetica').fontSize(tpl.fontSizeItems);

    for (const p of payments) {
      const received = roundCop(dec(p.amount));
      const change = roundCop(dec(p.change));
      const net = roundCop(received - change);
      const label = PAYMENT_METHOD_LABEL[p.method] ?? p.method;

      if (p.method === 'CASH') {
        doc.text(`• ${label} — Recibido: $ ${formatCop(received)}`, left, doc.y, {
          width: contentW,
        });
        doc.moveDown(0.15);
        if (change > 0) {
          doc.text(`  Cambio: $ ${formatCop(change)}`, left, doc.y, { width: contentW });
          doc.moveDown(0.15);
        }
        doc.text(`  Aplicado: $ ${formatCop(net)}`, left, doc.y, { width: contentW });
      } else {
        doc.text(`• ${label}: $ ${formatCop(net)}`, left, doc.y, { width: contentW });
      }
      doc.moveDown(0.25);
    }
  }

  private async buildPdf(
    inv: NonNullable<InvoiceWithSale>,
    company: TicketCompanyInfo,
    tpl: InvoiceTemplateConfig,
    footerNote: string,
  ): Promise<Buffer> {
    const fullNumber = `${inv.prefix}-${inv.number}`;
    const issueDateStr = inv.date.toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const margins = {
      top: mmToPt(tpl.marginTopMm),
      right: mmToPt(tpl.marginRightMm),
      bottom: mmToPt(tpl.marginBottomMm),
      left: mmToPt(tpl.marginLeftMm),
    };
    const { size, layout } = pdfDocSize(tpl);
    const footerLines = [tpl.footerText?.trim(), footerNote?.trim()].filter(Boolean);
    if (tpl.showSimplifiedRegimeLine) {
      footerLines.push(
        'No requiere factura electrónica – comprobante válido para el cliente',
      );
    }
    const footerLine = footerLines.join('\n\n');
    const logoPath = tpl.showLogo ? await this.resolveLogoPath() : null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size,
        layout,
        margins,
        info: { Title: `Comprobante ${fullNumber}`, Author: company.name },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const left = margins.left;
      const right = margins.right;
      const contentW = doc.page.width - left - right;
      const pageBottom = () => doc.page.maxY();

      const ensureSpace = (neededPt: number) => {
        if (doc.y + neededPt > pageBottom()) doc.addPage();
      };

      const money = (n: number) =>
        n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

      doc.font('Helvetica').fillColor(tpl.textColor);

      if (logoPath) {
        try {
          const logoH = mmToPt(14);
          doc.image(logoPath, left, doc.y, { fit: [contentW, logoH], align: 'center' });
          doc.y += logoH + 6;
        } catch {
          /* omitir logo si falla */
        }
      }

      doc.fontSize(tpl.fontSizeTitle).font('Helvetica-Bold');
      doc.text(company.name, left, doc.y, { width: contentW, align: 'center' });
      doc.moveDown(0.2);
      if (company.taxId) {
        doc.fontSize(tpl.fontSizeBody).font('Helvetica');
        doc.text(`NIT ${company.taxId}`, left, doc.y, { width: contentW, align: 'center' });
        doc.moveDown(0.15);
      }
      if (company.address) {
        doc.text(company.address, left, doc.y, { width: contentW, align: 'center' });
        doc.moveDown(0.2);
      }

      doc.fontSize(tpl.fontSizeTitle).font('Helvetica-Bold').fillColor(tpl.accentColor);
      doc.text('COMPROBANTE DE VENTA', left, doc.y, { width: contentW, align: 'center' });
      doc.moveDown(0.25);
      doc.fontSize(tpl.fontSizeBody).font('Helvetica').fillColor(tpl.textColor);
      doc.text(`No. ${fullNumber}`, left, doc.y, { width: contentW, align: 'center' });
      doc.text(issueDateStr, left, doc.y, { width: contentW, align: 'center' });
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').text('Cliente', left, doc.y, { width: contentW });
      doc.moveDown(0.15);
      doc.font('Helvetica');
      doc.text(inv.customerName ?? 'Consumidor final', left, doc.y, { width: contentW });
      if (inv.customerDoc) doc.text(inv.customerDoc, left, doc.y, { width: contentW });
      doc.moveDown(0.4);

      const wSub = tpl.showSubtotal ? 56 : 0;
      const wQty = 32;
      const wSku = tpl.showItemSku ? 48 : 0;
      const colSub = doc.page.width - right - wSub;
      const colQty = colSub - wQty - 4;
      const colSku = left;
      const colName = tpl.showItemSku ? colSku + wSku + 4 : left;
      const wName = Math.max(60, colQty - colName - 4);

      const drawItemsHeader = (y: number) => {
        doc.fontSize(tpl.fontSizeItems).fillColor('#333333').font('Helvetica-Bold');
        if (tpl.showItemSku) doc.text('SKU', colSku, y, { width: wSku });
        doc.text('Producto', colName, y, { width: wName });
        doc.text('Cant.', colQty, y, { width: wQty, align: 'right' });
        if (tpl.showSubtotal) {
          doc.text('Valor', colSub, y, { width: wSub, align: 'right' });
        }
        const lineY = y + 11;
        doc.moveTo(left, lineY).lineTo(left + contentW, lineY).strokeColor('#ccc').lineWidth(0.5).stroke();
        return lineY + 6;
      };

      let yItems = drawItemsHeader(doc.y);
      doc.y = yItems;
      doc.fillColor(tpl.textColor).font('Helvetica');

      for (const it of inv.sale.items) {
        const rowH = 20;
        if (doc.y + rowH > pageBottom() - 8) {
          doc.addPage();
          yItems = drawItemsHeader(doc.y);
          doc.y = yItems;
        }
        const rowTop = doc.y;
        if (tpl.showItemSku) {
          doc.fontSize(tpl.fontSizeItems).text(it.product.sku, colSku, rowTop, { width: wSku });
        }
        doc.text(it.product.name, colName, rowTop, { width: wName });
        doc.text(String(qtyToNumber(it.quantity)), colQty, rowTop, { width: wQty, align: 'right' });
        if (tpl.showSubtotal) {
          doc.text(money(dec(it.subtotal)), colSub, rowTop, { width: wSub, align: 'right' });
        }
        doc.y = rowTop + rowH;
      }

      doc.moveDown(0.35);
      doc.moveTo(left, doc.y).lineTo(left + contentW, doc.y).strokeColor('#ccc').stroke();
      doc.moveDown(0.35);

      ensureSpace(60);
      doc.fontSize(tpl.fontSizeBody).font('Helvetica');
      if (tpl.showSubtotal) {
        doc.text(`Subtotal: $ ${money(dec(inv.subtotal))}`, left, doc.y, {
          width: contentW,
          align: 'right',
        });
      }
      if (tpl.showTax && dec(inv.taxTotal) > 0) {
        doc.text(`IVA: $ ${money(dec(inv.taxTotal))}`, left, doc.y, {
          width: contentW,
          align: 'right',
        });
      }
      doc.font('Helvetica-Bold').text(`TOTAL: $ ${money(dec(inv.total))}`, left, doc.y, {
        width: contentW,
        align: 'right',
      });
      doc.font('Helvetica');

      this.drawPaymentsSection(doc, inv.sale.payments, contentW, left, tpl, ensureSpace);

      if (footerLine) {
        doc.moveDown(0.5);
        ensureSpace(30);
        doc.fontSize(tpl.fontSizeFooter).fillColor('#666666').text(footerLine, {
          width: contentW,
          align: 'center',
          lineGap: 2,
        });
      }

      doc.end();
    });
  }
}
