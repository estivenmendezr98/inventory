import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { SaleLineInputDto } from '../../modules/sales/dto/create-sale.dto';
import {
  assertSaleQuantity,
  productUnitProfileFromRow,
  resolveSaleUnitId,
  toBaseQuantity,
} from './product-unit-conversion.util';

export type NormalizedSaleLine = SaleLineInputDto & {
  saleUnitId: string;
  baseQuantity: number;
};

const productInclude = {
  unitOfMeasure: true,
  contentUnit: true,
  alternateUnits: { include: { unitOfMeasure: true }, orderBy: { sortOrder: 'asc' as const } },
} as const;

export async function normalizeSaleLines(
  client: Prisma.TransactionClient,
  lines: SaleLineInputDto[],
): Promise<NormalizedSaleLine[]> {
  if (lines.length === 0) return [];
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const products = await client.product.findMany({
    where: { id: { in: productIds } },
    include: productInclude,
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product?.isActive) {
      throw new BadRequestException(`Producto no disponible: ${line.productId}`);
    }
    const profile = productUnitProfileFromRow(product);
    const saleUnitId = resolveSaleUnitId(profile, line.saleUnitId);
    assertSaleQuantity(line.quantity, saleUnitId, profile);
    const baseQuantity = toBaseQuantity(line.quantity, saleUnitId, profile);
    return { ...line, saleUnitId, baseQuantity };
  });
}
