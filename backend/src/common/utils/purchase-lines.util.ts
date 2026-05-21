import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PurchaseLineInputDto } from '../../modules/purchases/dto/create-purchase.dto';
import {
  assertOperationalQuantity,
  productUnitProfileFromRow,
  resolveSaleUnitId,
  toBaseQuantity,
} from './product-unit-conversion.util';

export type NormalizedPurchaseLine = PurchaseLineInputDto & {
  purchaseUnitId: string;
  baseQuantity: number;
};

const productInclude = {
  unitOfMeasure: true,
  contentUnit: true,
  alternateUnits: { include: { unitOfMeasure: true }, orderBy: { sortOrder: 'asc' as const } },
} as const;

export async function normalizePurchaseLines(
  client: Prisma.TransactionClient,
  lines: PurchaseLineInputDto[],
): Promise<NormalizedPurchaseLine[]> {
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
    const purchaseUnitId = resolveSaleUnitId(profile, line.purchaseUnitId);
    assertOperationalQuantity(line.quantity, purchaseUnitId, profile);
    const baseQuantity = toBaseQuantity(line.quantity, purchaseUnitId, profile);
    return { ...line, purchaseUnitId, baseQuantity };
  });
}
