import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { applyEmailTemplate, type InvoiceEmailConfig } from './invoice-email.config';
import { TicketIssuerService } from './ticket-issuer.service';

export interface SendInvoiceEmailParams {
  to: string;
  subject?: string;
  body?: string;
  cc?: string;
  fullNumber: string;
  customerName: string;
  totalFormatted: string;
  dateFormatted: string;
  pdfBuffer?: Buffer;
  pdfFilename: string;
}

@Injectable()
export class InvoiceMailService {
  private readonly logger = new Logger(InvoiceMailService.name);

  constructor(private readonly ticketIssuer: TicketIssuerService) {}

  private createTransport(
    config: InvoiceEmailConfig & { smtpPassword: string },
  ): Transporter {
    return nodemailer.createTransport({
      host: config.smtpHost.trim(),
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth:
        config.smtpUser.trim() && config.smtpPassword
          ? { user: config.smtpUser.trim(), pass: config.smtpPassword }
          : undefined,
    });
  }

  async sendInvoice(
    config: InvoiceEmailConfig & { smtpPassword: string },
    params: SendInvoiceEmailParams,
  ): Promise<void> {
    const company = await this.ticketIssuer.resolve();
    const vars: Record<string, string> = {
      fullNumber: params.fullNumber,
      customerName: params.customerName,
      total: params.totalFormatted,
      date: params.dateFormatted,
      companyName: company.name,
    };

    const subject = applyEmailTemplate(
      params.subject?.trim() || config.defaultSubject,
      vars,
    );
    const text = applyEmailTemplate(params.body?.trim() || config.defaultBody, vars);

    const attachments: nodemailer.SendMailOptions['attachments'] = [];
    if (config.attachPdf && params.pdfBuffer?.length) {
      attachments.push({
        filename: params.pdfFilename,
        content: params.pdfBuffer,
        contentType: 'application/pdf',
      });
    }
    const fromEmail = config.fromEmail.trim() || config.smtpUser.trim();
    const transport = this.createTransport(config);
    try {
      await transport.sendMail({
        from: config.fromName.trim()
          ? `"${config.fromName.replace(/"/g, '')}" <${fromEmail}>`
          : fromEmail,
        to: params.to.trim(),
        cc: params.cc?.trim() || undefined,
        replyTo: config.replyTo.trim() || undefined,
        subject,
        text,
        attachments,
      });
    } catch (e) {
      this.logger.warn(`SMTP factura: ${e instanceof Error ? e.message : e}`);
      throw new InternalServerErrorException(
        `No se pudo enviar el correo: ${e instanceof Error ? e.message : 'error SMTP'}`,
      );
    } finally {
      transport.close();
    }
  }

  async sendTest(
    config: InvoiceEmailConfig & { smtpPassword: string },
    to: string,
  ): Promise<void> {
    const transport = this.createTransport(config);
    const fromEmail = config.fromEmail.trim() || config.smtpUser.trim();
    if (!fromEmail) {
      throw new BadRequestException('Indique correo remitente o usuario SMTP.');
    }
    try {
      await transport.sendMail({
        from: config.fromName.trim()
          ? `"${config.fromName.replace(/"/g, '')}" <${fromEmail}>`
          : fromEmail,
        to: to.trim(),
        subject: 'Prueba — Sistema de inventario',
        text: 'Si recibe este mensaje, la configuración SMTP de comprobantes es correcta.',
      });
    } catch (e) {
      throw new InternalServerErrorException(
        `Prueba SMTP fallida: ${e instanceof Error ? e.message : 'error'}`,
      );
    } finally {
      transport.close();
    }
  }
}
