import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type TicketCompanyInfo = {
  name: string;
  taxId: string;
  address: string;
};

@Injectable()
export class TicketIssuerService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(): Promise<TicketCompanyInfo> {
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: ['company.name', 'company.tax_id', 'company.address'] } },
    });
    const m = new Map(rows.map((r) => [r.key, (r.value ?? '').trim()]));
    return {
      name: m.get('company.name') || 'Mi negocio',
      taxId: m.get('company.tax_id') || '',
      address: m.get('company.address') || '',
    };
  }
}
