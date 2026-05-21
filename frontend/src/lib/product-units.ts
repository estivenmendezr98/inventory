import type { UnitOfMeasureDto } from './units-of-measure';
import { roundQtyForUnit } from './units-of-measure';

export type AlternateUnitDto = {
  unitOfMeasureId: string;
  factorToBase: number;
  label?: string | null;
  unitOfMeasure: UnitOfMeasureDto;
};

export type SaleUnitOption = {
  id: string;
  symbol: string;
  name: string;
  isBaseUnit: boolean;
  factorToBase: number;
};

export type ProductUnitsProfile = {
  unitOfMeasureId: string;
  unitOfMeasure: UnitOfMeasureDto;
  contentPerUnit?: number | null;
  contentUnitId?: string | null;
  contentUnit?: UnitOfMeasureDto | null;
  alternateUnits?: AlternateUnitDto[];
  saleUnits?: SaleUnitOption[];
};

function legacyAlternate(p: ProductUnitsProfile): AlternateUnitDto | null {
  if (
    !p.contentUnitId ||
    p.contentUnitId === p.unitOfMeasureId ||
    !p.contentUnit ||
    p.contentPerUnit == null ||
    p.contentPerUnit <= 0
  ) {
    return null;
  }
  return {
    unitOfMeasureId: p.contentUnitId,
    factorToBase: 1 / p.contentPerUnit,
    unitOfMeasure: p.contentUnit,
  };
}

export function resolvedAlternates(p: ProductUnitsProfile): AlternateUnitDto[] {
  if (p.alternateUnits?.length) return p.alternateUnits;
  const leg = legacyAlternate(p);
  return leg ? [leg] : [];
}

export function listSaleUnits(p: ProductUnitsProfile): SaleUnitOption[] {
  if (p.saleUnits?.length) return p.saleUnits;
  const opts: SaleUnitOption[] = [
    {
      id: p.unitOfMeasureId,
      symbol: p.unitOfMeasure.symbol,
      name: p.unitOfMeasure.name,
      isBaseUnit: true,
      factorToBase: 1,
    },
  ];
  for (const alt of resolvedAlternates(p)) {
    opts.push({
      id: alt.unitOfMeasureId,
      symbol: alt.unitOfMeasure.symbol,
      name: alt.label?.trim() || alt.unitOfMeasure.name,
      isBaseUnit: false,
      factorToBase: alt.factorToBase,
    });
  }
  return opts;
}

export function hasAlternateUnits(p: ProductUnitsProfile): boolean {
  return resolvedAlternates(p).length > 0;
}

export function canUseUnit(p: ProductUnitsProfile, unitId: string): boolean {
  return listSaleUnits(p).some((u) => u.id === unitId);
}

export function factorForUnit(p: ProductUnitsProfile, unitId: string): number {
  const u = listSaleUnits(p).find((x) => x.id === unitId);
  if (!u) throw new Error('Unidad no válida para el producto');
  return u.factorToBase;
}

export function toBaseQuantity(
  qty: number,
  unitId: string,
  p: ProductUnitsProfile,
): number {
  return roundQtyForUnit(qty * factorForUnit(p, unitId), p.unitOfMeasure);
}

export function fromBaseQuantity(
  baseQty: number,
  unitId: string,
  p: ProductUnitsProfile,
): number {
  const factor = factorForUnit(p, unitId);
  const unit = listSaleUnits(p).find((x) => x.id === unitId)?.isBaseUnit
    ? p.unitOfMeasure
    : resolvedAlternates(p).find((a) => a.unitOfMeasureId === unitId)?.unitOfMeasure ??
      p.unitOfMeasure;
  return roundQtyForUnit(baseQty / factor, unit);
}

export function unitForSale(
  p: ProductUnitsProfile,
  unitId: string,
): UnitOfMeasureDto {
  if (unitId === p.unitOfMeasureId) return p.unitOfMeasure;
  const alt = resolvedAlternates(p).find((a) => a.unitOfMeasureId === unitId);
  if (alt) return alt.unitOfMeasure;
  return p.unitOfMeasure;
}

export function profileFromProduct(p: ProductUnitsProfile): ProductUnitsProfile {
  return p;
}

/** @deprecated alias */
export function hasAlternateSaleUnit(p: ProductUnitsProfile): boolean {
  return hasAlternateUnits(p);
}
