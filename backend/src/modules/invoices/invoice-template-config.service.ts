import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_INVOICE_TEMPLATE,
  INVOICE_TEMPLATE_SETTING_KEY,
  parseInvoiceTemplateConfig,
  serializeInvoiceTemplateConfig,
  type InvoiceTemplateConfig,
} from './invoice-template.config';

@Injectable()
export class InvoiceTemplateConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<InvoiceTemplateConfig> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: INVOICE_TEMPLATE_SETTING_KEY },
    });
    const raw = row?.value ?? '';
    const parsed = parseInvoiceTemplateConfig(raw);
    if (raw.trim()) {
      const lower = raw.toLowerCase();
      const needsMigration =
        lower.includes('dian') ||
        lower.includes('ubl 2.1') ||
        lower.includes('cufe') ||
        lower.includes('proveedor tecnológico') ||
        lower.includes('representación gráfica') ||
        lower.includes('firma digital');
      if (needsMigration) {
        return this.save(parsed);
      }
    }
    return parsed;
  }

  async save(config: InvoiceTemplateConfig): Promise<InvoiceTemplateConfig> {
    const normalized = parseInvoiceTemplateConfig(serializeInvoiceTemplateConfig(config));
    await this.prisma.appSetting.upsert({
      where: { key: INVOICE_TEMPLATE_SETTING_KEY },
      update: { value: serializeInvoiceTemplateConfig(normalized) },
      create: { key: INVOICE_TEMPLATE_SETTING_KEY, value: serializeInvoiceTemplateConfig(normalized) },
    });
    return normalized;
  }

  defaults(): InvoiceTemplateConfig {
    return { ...DEFAULT_INVOICE_TEMPLATE };
  }

  /** Pie opcional desde Configuración → `invoice.footer_note`. */
  async resolveFooterNote(): Promise<string> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: 'invoice.footer_note' },
    });
    return (row?.value ?? '').trim();
  }
}
