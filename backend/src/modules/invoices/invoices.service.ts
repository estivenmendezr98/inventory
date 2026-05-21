import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { UpdateInvoiceNumberingDto } from './dto/update-invoice-numbering.dto';
import { InvoiceArtifactsService } from './invoice-artifacts.service';
import { MinioStorageService } from '../../common/storage/minio-storage.service';
import { ensureInvoiceStorageDir, invoiceLocalPath } from './invoice-storage.paths';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { Readable } from 'node:stream';
import { AuditService } from '../audit/audit.service';
import { auditJson, snapshotInvoice } from '../audit/audit-snapshots.util';
import { InvoiceTemplateConfigService } from './invoice-template-config.service';
import { InvoiceEmailConfigService } from './invoice-email-config.service';
import { InvoiceMailService } from './invoice-mail.service';
import { UpdateInvoiceTemplateDto } from './dto/update-invoice-template.dto';
import { UpdateInvoiceEmailDto, SendInvoiceEmailDto } from './dto/update-invoice-email.dto';
import {
  parseInvoiceTemplateConfig,
  serializeInvoiceTemplateConfig,
} from './invoice-template.config';
import {
  parseInvoiceEmailConfig,
  serializeInvoiceEmailConfig,
} from './invoice-email.config';
import { TicketIssuerService } from './ticket-issuer.service';
import {
  buildThermalReceiptPayload,
  buildThermalReceiptSample,
} from './thermal-receipt.builder';

/** Factura vigente para PDF, envío por correo, etc. */
export function isInvoiceOperational(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.ACTIVE || status === InvoiceStatus.ACTIVE_ADJUSTED;
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly artifacts: InvoiceArtifactsService,
    private readonly minio: MinioStorageService,
    private readonly templateConfig: InvoiceTemplateConfigService,
    private readonly emailConfig: InvoiceEmailConfigService,
    private readonly invoiceMail: InvoiceMailService,
    private readonly audit: AuditService,
    private readonly ticketIssuer: TicketIssuerService,
  ) {}

  private async loadCompanyForReceipt(): Promise<{
    name: string;
    taxId: string;
    address: string;
    phone: string;
  }> {
    const base = await this.ticketIssuer.resolve();
    const rows = await this.prisma.appSetting.findMany({
      where: { key: 'company.phone' },
    });
    const phone = rows[0]?.value?.trim() ?? '';
    return { ...base, phone };
  }

  private async loadFooterNote(): Promise<string> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: 'invoice.footer_note' },
    });
    return row?.value?.trim() ?? '';
  }

  async getThermalReceipt(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            payments: { orderBy: { createdAt: 'asc' } },
            items: {
              include: {
                product: { select: { sku: true, name: true } },
                saleUnit: { select: { symbol: true } },
              },
              orderBy: { id: 'asc' },
            },
          },
        },
      },
    });
    if (!inv) throw new NotFoundException('Comprobante no encontrado');

    const [company, footerNote, template] = await Promise.all([
      this.loadCompanyForReceipt(),
      this.loadFooterNote(),
      this.templateConfig.get(),
    ]);

    return buildThermalReceiptPayload({
      invoice: inv,
      company,
      footerNote,
      template,
    });
  }

  async getThermalReceiptSample() {
    const [company, footerNote, template] = await Promise.all([
      this.loadCompanyForReceipt(),
      this.loadFooterNote(),
      this.templateConfig.get(),
    ]);
    return buildThermalReceiptSample(company, template, footerNote);
  }

  /** Si no hay numeración activa (BD previa al seed), crea o reactiva TKT. */
  private async resolveActiveNumbering(tx: Prisma.TransactionClient) {
    let numbering = await tx.invoiceNumbering.findFirst({
      where: { isActive: true },
      orderBy: { prefix: 'asc' },
    });
    if (numbering) return numbering;

    const tkt = await tx.invoiceNumbering.findUnique({ where: { prefix: 'TKT' } });
    if (tkt) {
      return tx.invoiceNumbering.update({
        where: { id: tkt.id },
        data: { isActive: true },
      });
    }

    return tx.invoiceNumbering.create({
      data: {
        prefix: 'TKT',
        resolutionNumber: 'Comprobante interno (no fiscal)',
        startNumber: 1,
        endNumber: 4999999,
        currentNumber: 0,
        startDate: new Date(),
        endDate: new Date('2030-12-31T23:59:59.000Z'),
        isActive: true,
      },
    });
  }

  private mapList(inv: {
    id: string;
    number: number;
    prefix: string;
    date: Date;
    total: Prisma.Decimal;
    status: InvoiceStatus;
    customerName: string | null;
    customerDoc: string | null;
    sale: { id: string; number: string };
  }) {
    return {
      id: inv.id,
      fullNumber: `${inv.prefix}-${inv.number}`,
      prefix: inv.prefix,
      number: inv.number,
      date: inv.date.toISOString(),
      total: inv.total.toString(),
      status: inv.status,
      customerName: inv.customerName,
      customerDoc: inv.customerDoc,
      saleId: inv.sale.id,
      saleNumber: inv.sale.number,
    };
  }

  async findAll(query: QueryInvoicesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const s = query.search.trim();
      const or: Prisma.InvoiceWhereInput[] = [
        { sale: { number: { contains: s, mode: 'insensitive' } } },
        { customerName: { contains: s, mode: 'insensitive' } },
        { customerDoc: { contains: s, mode: 'insensitive' } },
        { prefix: { contains: s, mode: 'insensitive' } },
      ];
      const num = parseInt(s.replace(/\D/g, ''), 10);
      if (Number.isFinite(num) && num > 0) {
        or.push({ number: num });
      }
      where.OR = or;
    }

    const [total, rows] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          sale: { select: { id: true, number: true } },
        },
      }),
    ]);

    return {
      data: rows.map((r) => this.mapList(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            customer: { select: { id: true, name: true, documentNumber: true, documentType: true } },
            payments: { orderBy: { createdAt: 'asc' } },
            items: {
              include: { product: { select: { id: true, sku: true, name: true } } },
              orderBy: { id: 'asc' },
            },
          },
        },
      },
    });
    if (!inv) throw new NotFoundException('Factura no encontrada');

    return {
      id: inv.id,
      fullNumber: `${inv.prefix}-${inv.number}`,
      prefix: inv.prefix,
      number: inv.number,
      resolutionNumber: inv.resolutionNumber,
      date: inv.date.toISOString(),
      subtotal: inv.subtotal.toString(),
      taxTotal: inv.taxTotal.toString(),
      total: inv.total.toString(),
      status: inv.status,
      customerName: inv.customerName,
      customerDoc: inv.customerDoc,
      electronicTrackId: inv.electronicTrackId,
      cufe: inv.cufe,
      qrPayload: inv.qrPayload,
      pdfUrl: inv.pdfUrl,
      xmlUrl: inv.xmlUrl,
      createdAt: inv.createdAt.toISOString(),
      payments: inv.sale.payments.map((p) => ({
        id: p.id,
        method: p.method,
        amount: p.amount.toString(),
        change: p.change.toString(),
        reference: p.reference,
      })),
      sale: {
        id: inv.sale.id,
        number: inv.sale.number,
        status: inv.sale.status,
        customer: inv.sale.customer,
        items: inv.sale.items.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          unitPrice: it.unitPrice.toString(),
          discount: it.discount.toString(),
          taxRate: it.taxRate.toString(),
          subtotal: it.subtotal.toString(),
          product: it.product,
        })),
      },
    };
  }

  /** Vuelve a generar el PDF del comprobante con la plantilla actual. */
  async regenerateArtifacts(id: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Factura no encontrada');
    if (!isInvoiceOperational(inv.status)) {
      throw new BadRequestException(
        'Solo se pueden regenerar archivos de facturas activas o activas (ajustadas)',
      );
    }
    try {
      await this.artifacts.attachToInvoice(id, { force: true });
    } catch (err) {
      throw new InternalServerErrorException(
        `No se pudo regenerar el PDF: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return this.findOne(id);
  }

  async eligibleSales() {
    const rows = await this.prisma.sale.findMany({
      where: { status: SaleStatus.COMPLETED, invoice: null },
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: {
        id: true,
        number: true,
        total: true,
        createdAt: true,
        customer: { select: { id: true, name: true, documentNumber: true } },
      },
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        number: r.number,
        total: r.total.toString(),
        createdAt: r.createdAt.toISOString(),
        customer: r.customer,
      })),
    };
  }

  async createFromSale(saleId: string, actorUserId?: string | null, ipAddress?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { customer: true, invoice: true },
      });
      if (!sale) throw new NotFoundException('Venta no encontrada');
      if (sale.status !== SaleStatus.COMPLETED) {
        throw new BadRequestException(
          `Solo se facturan ventas completadas. Estado actual: ${sale.status}`,
        );
      }
      if (sale.invoice) {
        throw new ConflictException('Esta venta ya tiene factura');
      }

      const numbering = await this.resolveActiveNumbering(tx);

      let next = numbering.currentNumber + 1;
      if (next < numbering.startNumber) next = numbering.startNumber;
      if (next > numbering.endNumber) {
        throw new BadRequestException('Se agotó el rango de numeración autorizado');
      }

      const rollbackCurrent = numbering.currentNumber;

      const customerName = sale.customer?.name ?? 'Consumidor final';
      const customerDoc = sale.customer
        ? `${sale.customer.documentType} ${sale.customer.documentNumber}`
        : null;

      const invoice = await tx.invoice.create({
        data: {
          saleId: sale.id,
          number: next,
          prefix: numbering.prefix,
          resolutionNumber: numbering.resolutionNumber,
          date: new Date(),
          subtotal: sale.subtotal,
          taxTotal: sale.taxTotal,
          total: sale.total,
          status: InvoiceStatus.ACTIVE,
          customerName,
          customerDoc,
        },
      });

      await tx.invoiceNumbering.update({
        where: { id: numbering.id },
        data: { currentNumber: next },
      });

      return {
        invoiceId: invoice.id,
        numberingId: numbering.id,
        appliedNumber: next,
        rollbackCurrent,
      };
    });

    try {
      await this.artifacts.attachToInvoice(result.invoiceId);
    } catch (err) {
      await this.prisma.$transaction(async (tx) => {
        await tx.invoice.delete({ where: { id: result.invoiceId } }).catch(() => undefined);
        await tx.invoiceNumbering.update({
          where: { id: result.numberingId },
          data: { currentNumber: result.rollbackCurrent },
        });
      });
      throw new InternalServerErrorException(
        `No se pudo generar el PDF del comprobante: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const invoice = await this.findOne(result.invoiceId);
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: { id: true, number: true, userId: true },
    });
    await this.audit.record({
      userId: actorUserId ?? sale?.userId ?? null,
      action: 'invoice.create',
      module: 'invoices',
      entityId: result.invoiceId,
      entityType: 'Invoice',
      newData: auditJson({
        invoiceId: invoice.id,
        fullNumber: invoice.fullNumber,
        status: invoice.status,
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
        total: invoice.total,
        customerName: invoice.customerName,
        customerDoc: invoice.customerDoc,
        saleId,
        saleNumber: sale?.number ?? null,
        numberingApplied: result.appliedNumber,
      }),
      ipAddress: ipAddress ?? null,
    });

    return invoice;
  }

  /**
   * Crea factura al completar una venta (POS / venta manual).
   * No lanza: si falla el PDF la venta queda registrada y el comprobante puede generarse después.
   */
  async autoCreateFromSale(saleId: string): Promise<void> {
    try {
      await this.createFromSale(saleId);
      this.logger.log(`Factura automática creada para venta ${saleId}`);
    } catch (err) {
      if (err instanceof ConflictException) return;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`No se pudo facturar automáticamente la venta ${saleId}: ${msg}`);
    }
  }

  async cancel(id: string, actorUserId: string, ipAddress?: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { sale: { select: { id: true, number: true } } },
    });
    if (!inv) throw new NotFoundException('Factura no encontrada');
    if (!isInvoiceOperational(inv.status)) {
      throw new BadRequestException(
        'Solo se pueden anular facturas activas o activas (ajustadas)',
      );
    }

    await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });

    await this.audit.record({
      userId: actorUserId,
      action: 'invoice.cancel',
      module: 'invoices',
      entityId: id,
      entityType: 'Invoice',
      oldData: {
        ...snapshotInvoice(inv),
        saleId: inv.saleId,
        saleNumber: inv.sale?.number ?? null,
      },
      newData: { status: InvoiceStatus.CANCELLED },
      ipAddress: ipAddress ?? null,
    });

    return this.findOne(id);
  }

  /**
   * Tras anular la factura y aplicar un ajuste de venta: actualiza totales y pasa a ACTIVE_ADJUSTED.
   */
  async reactivateAfterSaleAdjustment(
    tx: Prisma.TransactionClient,
    params: {
      saleId: string;
      subtotal: Prisma.Decimal;
      taxTotal: Prisma.Decimal;
      total: Prisma.Decimal;
    },
  ): Promise<{ invoiceId: string; prefix: string; number: number } | null> {
    const inv = await tx.invoice.findUnique({ where: { saleId: params.saleId } });
    if (!inv || inv.status !== InvoiceStatus.CANCELLED) {
      return null;
    }

    await tx.invoice.update({
      where: { id: inv.id },
      data: {
        subtotal: params.subtotal,
        taxTotal: params.taxTotal,
        total: params.total,
        status: InvoiceStatus.ACTIVE_ADJUSTED,
        date: new Date(),
      },
    });

    return { invoiceId: inv.id, prefix: inv.prefix, number: inv.number };
  }

  async listNumbering() {
    const rows = await this.prisma.invoiceNumbering.findMany({
      orderBy: { prefix: 'asc' },
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        prefix: r.prefix,
        resolutionNumber: r.resolutionNumber,
        startNumber: r.startNumber,
        endNumber: r.endNumber,
        currentNumber: r.currentNumber,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        isActive: r.isActive,
      })),
    };
  }

  async updateNumbering(
    id: string,
    dto: UpdateInvoiceNumberingDto,
    actorUserId: string,
    ipAddress?: string,
  ) {
    const row = await this.prisma.invoiceNumbering.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Numeración no encontrada');

    const oldData = {
      prefix: row.prefix,
      resolutionNumber: row.resolutionNumber,
      startNumber: row.startNumber,
      endNumber: row.endNumber,
      currentNumber: row.currentNumber,
      endDate: row.endDate.toISOString(),
      isActive: row.isActive,
    };

    if (dto.prefix !== undefined) {
      const nextPrefix = dto.prefix.trim().toUpperCase();
      if (!nextPrefix || !/^[A-Z0-9-]{1,12}$/.test(nextPrefix)) {
        throw new BadRequestException(
          'El prefijo solo puede contener letras, números y guiones (máx. 12 caracteres).',
        );
      }
      if (nextPrefix !== row.prefix) {
        const dup = await this.prisma.invoiceNumbering.findUnique({
          where: { prefix: nextPrefix },
        });
        if (dup && dup.id !== id) {
          throw new ConflictException(`Ya existe numeración con prefijo ${nextPrefix}`);
        }
      }
    }

    const updated = await this.prisma.invoiceNumbering.update({
      where: { id },
      data: {
        ...(dto.prefix !== undefined && { prefix: dto.prefix.trim().toUpperCase() }),
        ...(dto.resolutionNumber !== undefined && { resolutionNumber: dto.resolutionNumber }),
        ...(dto.endNumber !== undefined && { endNumber: dto.endNumber }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.audit.record({
      userId: actorUserId,
      action: 'invoice.numbering_update',
      module: 'invoices',
      entityId: id,
      entityType: 'InvoiceNumbering',
      oldData,
      newData: {
        prefix: updated.prefix,
        resolutionNumber: updated.resolutionNumber,
        startNumber: updated.startNumber,
        endNumber: updated.endNumber,
        currentNumber: updated.currentNumber,
        endDate: updated.endDate.toISOString(),
        isActive: updated.isActive,
        request: auditJson(dto),
      },
      ipAddress: ipAddress ?? null,
    });

    return this.listNumbering();
  }

  async getInvoiceFileStream(
    invoiceId: string,
    kind: 'pdf' | 'xml',
  ): Promise<{ stream: Readable; contentType: string; filename: string }> {
    const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new NotFoundException('Factura no encontrada');

    const ext = kind === 'pdf' ? 'pdf' : 'xml';
    const contentType = kind === 'pdf' ? 'application/pdf' : 'application/xml';
    const filename = `${inv.prefix}-${inv.number}.${ext}`;

    if (this.minio.isEnabled()) {
      try {
        const stream = await this.minio.getObjectStream(this.minio.objectKey(invoiceId, kind));
        return { stream, contentType, filename };
      } catch {
        // intenta disco local
      }
    }

    const dir = ensureInvoiceStorageDir();
    const local = invoiceLocalPath(dir, invoiceId, kind);
    try {
      await access(local, constants.R_OK);
    } catch {
      throw new NotFoundException(
        `No se encontró el archivo ${ext.toUpperCase()} de la factura. ¿Se generó antes de un reinicio sin volumen persistente?`,
      );
    }
    const stream = createReadStream(local);
    return { stream, contentType, filename };
  }

  async getTemplateConfig() {
    return { data: await this.templateConfig.get() };
  }

  async updateTemplateConfig(dto: UpdateInvoiceTemplateDto) {
    const current = await this.templateConfig.get();
    const merged = parseInvoiceTemplateConfig(
      serializeInvoiceTemplateConfig({ ...current, ...dto }),
    );
    const saved = await this.templateConfig.save(merged);
    return { data: saved };
  }

  async previewTemplatePdf(): Promise<Buffer> {
    return this.artifacts.buildPreviewPdf();
  }

  async getEmailConfig() {
    return { data: await this.emailConfig.getForApi() };
  }

  async updateEmailConfig(dto: UpdateInvoiceEmailDto) {
    const current = await this.emailConfig.getWithSecrets();
    const {
      smtpPassword,
      smtpPasswordSet: _smtpPasswordSet,
      configured: _configured,
      issues: _issues,
      ...rest
    } = dto;
    void _smtpPasswordSet;
    void _configured;
    void _issues;
    const merged = parseInvoiceEmailConfig(
      serializeInvoiceEmailConfig({
        enabled: rest.enabled ?? current.enabled,
        smtpHost: rest.smtpHost ?? current.smtpHost,
        smtpPort: rest.smtpPort ?? current.smtpPort,
        smtpSecure: rest.smtpSecure ?? current.smtpSecure,
        smtpUser: rest.smtpUser ?? current.smtpUser,
        fromName: rest.fromName ?? current.fromName,
        fromEmail: rest.fromEmail ?? current.fromEmail,
        defaultSubject: rest.defaultSubject ?? current.defaultSubject,
        defaultBody: rest.defaultBody ?? current.defaultBody,
        attachPdf: rest.attachPdf ?? current.attachPdf,
        attachXml: rest.attachXml ?? current.attachXml,
        replyTo: rest.replyTo ?? current.replyTo,
      }),
    );
    return { data: await this.emailConfig.save(merged, smtpPassword) };
  }

  async testEmailConfig(to: string) {
    const cfg = await this.emailConfig.getWithSecrets();
    this.emailConfig.assertReadyForSmtpTest(cfg);
    await this.invoiceMail.sendTest(cfg, to);
    return { ok: true, message: `Correo de prueba enviado a ${to}` };
  }

  async sendInvoiceEmail(id: string, dto: SendInvoiceEmailDto) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Factura no encontrada');
    if (!isInvoiceOperational(inv.status)) {
      throw new BadRequestException('Solo se pueden enviar facturas activas o activas (ajustadas)');
    }

    const cfg = await this.emailConfig.getWithSecrets();
    this.emailConfig.assertReadyForSend(cfg);
    const pdfBuf = await this.readInvoiceFileBuffer(id, 'pdf');

    const cop = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

    await this.invoiceMail.sendInvoice(cfg, {
      to: dto.to,
      cc: dto.cc,
      subject: dto.subject,
      body: dto.body,
      fullNumber: `${inv.prefix}-${inv.number}`,
      customerName: inv.customerName ?? 'Cliente',
      totalFormatted: cop.format(Number(inv.total)),
      dateFormatted: inv.date.toLocaleDateString('es-CO'),
      pdfBuffer: pdfBuf,
      pdfFilename: `${inv.prefix}-${inv.number}.pdf`,
    });

    return { ok: true, message: `Comprobante enviado a ${dto.to}` };
  }

  private async readInvoiceFileBuffer(invoiceId: string, kind: 'pdf'): Promise<Buffer> {
    const { stream } = await this.getInvoiceFileStream(invoiceId, kind);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

}
