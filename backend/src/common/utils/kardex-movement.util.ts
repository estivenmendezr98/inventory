import { KardexType, Prisma } from '@prisma/client';
import { toQtyDecimal } from './product-quantity.util';

export type KardexMovementInput = {
  productId: string;
  type: KardexType;
  baseDelta: number;
  previousStock: number;
  newStock: number;
  unitCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId: string;
  operationalQuantity?: number | null;
  operationalUnitId?: string | null;
  conversionFactor?: number | null;
};

export function buildKardexCreateData(input: KardexMovementInput): Prisma.KardexEntryCreateInput {
  const data: Prisma.KardexEntryCreateInput = {
    product: { connect: { id: input.productId } },
    user: { connect: { id: input.userId } },
    type: input.type,
    quantity: toQtyDecimal(input.baseDelta),
    previousStock: toQtyDecimal(input.previousStock),
    newStock: toQtyDecimal(input.newStock),
    unitCost: input.unitCost,
    totalCost: input.totalCost,
    referenceType: input.referenceType ?? null,
    referenceId: input.referenceId ?? null,
    notes: input.notes ?? null,
  };

  if (
    input.operationalQuantity != null &&
    input.operationalUnitId &&
    input.conversionFactor != null &&
    input.conversionFactor > 0
  ) {
    data.operationalQuantity = toQtyDecimal(input.operationalQuantity);
    data.conversionFactor = new Prisma.Decimal(input.conversionFactor.toFixed(6));
    data.operationalUnit = { connect: { id: input.operationalUnitId } };
  }

  return data;
}
