import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_INVOICE_EMAIL,
  INVOICE_EMAIL_PASSWORD_KEY,
  INVOICE_EMAIL_SETTING_KEY,
  invoiceEmailConfigIssues,
  invoiceEmailPasswordFromEnv,
  mergeInvoiceEmailFromEnv,
  parseInvoiceEmailConfig,
  serializeInvoiceEmailConfig,
  type InvoiceEmailConfig,
} from './invoice-email.config';

export type InvoiceEmailConfigResponse = InvoiceEmailConfig & {
  smtpPasswordSet: boolean;
  configured: boolean;
  issues: string[];
};

@Injectable()
export class InvoiceEmailConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getForApi(): Promise<InvoiceEmailConfigResponse> {
    const config = await this.getWithSecrets();
    const { smtpPassword: _p, ...publicConfig } = config;
    void _p;
    const pwdRow = await this.prisma.appSetting.findUnique({
      where: { key: INVOICE_EMAIL_PASSWORD_KEY },
    });
    const issues = invoiceEmailConfigIssues(config, { requireEnabled: false });
    return {
      ...publicConfig,
      smtpPasswordSet: Boolean(pwdRow?.value?.trim()) || Boolean(invoiceEmailPasswordFromEnv()),
      configured: issues.length === 0,
      issues,
    };
  }

  async getWithSecrets(): Promise<InvoiceEmailConfig & { smtpPassword: string }> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: INVOICE_EMAIL_SETTING_KEY },
    });
    const fromDb = parseInvoiceEmailConfig(row?.value);
    const config = mergeInvoiceEmailFromEnv(fromDb);
    const pwdRow = await this.prisma.appSetting.findUnique({
      where: { key: INVOICE_EMAIL_PASSWORD_KEY },
    });
    const smtpPassword = pwdRow?.value?.trim() || invoiceEmailPasswordFromEnv();
    return {
      ...config,
      smtpPassword,
    };
  }

  assertReadyForSend(config: InvoiceEmailConfig & { smtpPassword: string }): void {
    const issues = invoiceEmailConfigIssues(config, { requireEnabled: true });
    if (issues.length > 0) {
      throw new BadRequestException(
        `Correo no configurado. Complete en Ticket / Comprobante → Correo: ${issues.join('; ')}. Luego pulse «Guardar correo».`,
      );
    }
  }

  assertReadyForSmtpTest(config: InvoiceEmailConfig & { smtpPassword: string }): void {
    const issues = invoiceEmailConfigIssues(config, { requireEnabled: false });
    if (issues.length > 0) {
      throw new BadRequestException(
        `SMTP incompleto. En Ticket / Comprobante → Correo configure: ${issues.join('; ')}. Luego «Guardar correo».`,
      );
    }
  }

  async save(
    config: InvoiceEmailConfig,
    smtpPassword?: string,
  ): Promise<InvoiceEmailConfigResponse> {
    const normalized = parseInvoiceEmailConfig(serializeInvoiceEmailConfig(config));
    await this.prisma.appSetting.upsert({
      where: { key: INVOICE_EMAIL_SETTING_KEY },
      update: { value: serializeInvoiceEmailConfig(normalized) },
      create: { key: INVOICE_EMAIL_SETTING_KEY, value: serializeInvoiceEmailConfig(normalized) },
    });
    if (smtpPassword !== undefined && smtpPassword.trim().length > 0) {
      await this.prisma.appSetting.upsert({
        where: { key: INVOICE_EMAIL_PASSWORD_KEY },
        update: { value: smtpPassword },
        create: { key: INVOICE_EMAIL_PASSWORD_KEY, value: smtpPassword },
      });
    }
    return this.getForApi();
  }

  defaults(): InvoiceEmailConfig {
    return { ...DEFAULT_INVOICE_EMAIL };
  }
}
