import { Injectable } from '@nestjs/common';
import { KardexType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryKardexDto } from './dto/query-kardex.dto';

const TYPE_LABEL: Record<KardexType, string> = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUST: 'Ajuste',
};

@Injectable()
export class KardexService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: QueryKardexDto): Prisma.KardexEntryWhereInput {
    const where: Prisma.KardexEntryWhereInput = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.referenceType) {
      where.referenceType = query.referenceType;
    }
    if (query.referenceId) {
      where.referenceId = query.referenceId;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.product = {
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { sku: { contains: s, mode: 'insensitive' } },
        ],
      };
    }

    return where;
  }

  async findAll(query: QueryKardexDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.kardexEntry.count({ where }),
      this.prisma.kardexEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unitOfMeasure: { select: { symbol: true } },
            },
          },
          operationalUnit: { select: { id: true, symbol: true, name: true } },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      data: rows.map((e) => ({
        id: e.id,
        type: e.type,
        typeLabel: TYPE_LABEL[e.type],
        quantity: Number(e.quantity),
        previousStock: Number(e.previousStock),
        newStock: Number(e.newStock),
        baseUnitSymbol: e.product.unitOfMeasure?.symbol ?? 'und',
        operationalQuantity:
          e.operationalQuantity != null ? Number(e.operationalQuantity) : null,
        operationalUnitId: e.operationalUnitId,
        operationalUnitSymbol: e.operationalUnit?.symbol ?? null,
        conversionFactor:
          e.conversionFactor != null ? Number(e.conversionFactor) : null,
        unitCost: e.unitCost.toString(),
        totalCost: e.totalCost.toString(),
        referenceType: e.referenceType,
        referenceId: e.referenceId,
        notes: e.notes,
        createdAt: e.createdAt.toISOString(),
        product: {
          id: e.product.id,
          sku: e.product.sku,
          name: e.product.name,
        },
        user: {
          id: e.user.id,
          name: `${e.user.firstName} ${e.user.lastName}`.trim(),
          email: e.user.email,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async exportCsv(query: QueryKardexDto): Promise<{ filename: string; body: string }> {
    const where = this.buildWhere(query);
    const rows = await this.prisma.kardexEntry.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 50_000,
      include: {
        product: { select: { sku: true, name: true } },
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = [
      'fecha',
      'sku',
      'producto',
      'tipo',
      'tipo_etiqueta',
      'cantidad',
      'stock_anterior',
      'stock_nuevo',
      'costo_unitario',
      'costo_total',
      'referencia_tipo',
      'referencia_id',
      'usuario',
      'email',
      'notas',
    ].join(',');

    const lines = rows.map((e) =>
      [
        e.createdAt.toISOString(),
        esc(e.product.sku),
        esc(e.product.name),
        e.type,
        esc(TYPE_LABEL[e.type]),
        e.quantity,
        e.previousStock,
        e.newStock,
        Number(e.unitCost).toFixed(2),
        Number(e.totalCost).toFixed(2),
        esc(e.referenceType ?? ''),
        esc(e.referenceId ?? ''),
        esc(`${e.user.firstName} ${e.user.lastName}`.trim()),
        esc(e.user.email),
        esc(e.notes ?? ''),
      ].join(','),
    );

    const fromStr = query.from?.slice(0, 10) ?? 'inicio';
    const toStr = query.to?.slice(0, 10) ?? 'fin';
    return {
      filename: `kardex_${fromStr}_${toStr}.csv`,
      body: [header, ...lines].join('\n'),
    };
  }
}
