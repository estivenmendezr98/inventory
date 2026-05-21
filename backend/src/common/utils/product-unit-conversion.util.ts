import { BadRequestException } from '@nestjs/common';
import { assertQuantityForUnit, qtyToNumber, roundQty, type UnitForQty } from './product-quantity.util';

export type AlternateUnitRow = {
  unitOfMeasureId: string;
  factorToBase: number;
  unitOfMeasure: UnitForQty;
  label?: string | null;
};

export type ProductUnitProfile = {
  baseUnitId: string;
  baseUnit: UnitForQty;
  alternateUnits: AlternateUnitRow[];
};

/** @deprecated Compatibilidad con contentPerUnit/contentUnitId si no hay filas en product_alternate_units */
export type LegacyContentFields = {
  contentPerUnit: number | null;
  contentUnitId: string | null;
  contentUnit: UnitForQty | null;
};

export function legacyAlternateFromContent(
  legacy: LegacyContentFields,
  baseUnitId: string,
): AlternateUnitRow | null {
  if (
    !legacy.contentUnitId ||
    legacy.contentUnitId === baseUnitId ||
    !legacy.contentUnit ||
    legacy.contentPerUnit == null ||
    legacy.contentPerUnit <= 0
  ) {
    return null;
  }
  return {
    unitOfMeasureId: legacy.contentUnitId,
    factorToBase: 1 / legacy.contentPerUnit,
    unitOfMeasure: legacy.contentUnit,
  };
}

export function buildAlternateUnits(
  baseUnitId: string,
  rows: AlternateUnitRow[],
  legacy?: LegacyContentFields,
): AlternateUnitRow[] {
  const map = new Map<string, AlternateUnitRow>();
  for (const r of rows) {
    if (r.unitOfMeasureId !== baseUnitId && r.factorToBase > 0) {
      map.set(r.unitOfMeasureId, r);
    }
  }
  if (map.size === 0 && legacy) {
    const leg = legacyAlternateFromContent(legacy, baseUnitId);
    if (leg) map.set(leg.unitOfMeasureId, leg);
  }
  return [...map.values()].sort((a, b) => a.unitOfMeasureId.localeCompare(b.unitOfMeasureId));
}

export function hasAlternateUnits(p: ProductUnitProfile): boolean {
  return p.alternateUnits.length > 0;
}

export function listSaleUnitOptions(p: ProductUnitProfile): Array<{
  id: string;
  symbol: string;
  name: string;
  isBaseUnit: boolean;
  factorToBase: number;
}> {
  const opts = [
    {
      id: p.baseUnitId,
      symbol: p.baseUnit.symbol ?? 'und',
      name: p.baseUnit.name ?? 'Unidad base',
      isBaseUnit: true,
      factorToBase: 1,
    },
  ];
  for (const alt of p.alternateUnits) {
    opts.push({
      id: alt.unitOfMeasureId,
      symbol: alt.unitOfMeasure.symbol ?? '',
      name: alt.label?.trim() || alt.unitOfMeasure.name || 'Alterna',
      isBaseUnit: false,
      factorToBase: alt.factorToBase,
    });
  }
  return opts;
}

export function findAlternate(p: ProductUnitProfile, unitId: string): AlternateUnitRow | undefined {
  return p.alternateUnits.find((a) => a.unitOfMeasureId === unitId);
}

export function resolveSaleUnitId(p: ProductUnitProfile, saleUnitId?: string | null): string {
  const id = saleUnitId?.trim() || p.baseUnitId;
  if (!canSellInUnit(p, id)) {
    const symbols = listSaleUnitOptions(p)
      .map((o) => o.symbol)
      .join(', ');
    throw new BadRequestException(
      `Unidad no válida para este producto. Use una de: ${symbols}`,
    );
  }
  return id;
}

export function canSellInUnit(p: ProductUnitProfile, unitId: string): boolean {
  if (unitId === p.baseUnitId) return true;
  return Boolean(findAlternate(p, unitId));
}

export function factorForUnit(p: ProductUnitProfile, unitId: string): number {
  if (unitId === p.baseUnitId) return 1;
  const alt = findAlternate(p, unitId);
  if (!alt) {
    throw new BadRequestException('Unidad no configurada para este producto');
  }
  return alt.factorToBase;
}

/** Cantidad operativa → unidad base. */
export function toBaseQuantity(
  operationalQty: number,
  unitId: string,
  p: ProductUnitProfile,
): number {
  const factor = factorForUnit(p, unitId);
  const base = operationalQty * factor;
  return roundQty(base, p.baseUnit.decimalPlaces);
}

export function fromBaseQuantity(
  baseQty: number,
  unitId: string,
  p: ProductUnitProfile,
): number {
  const factor = factorForUnit(p, unitId);
  if (factor <= 0) throw new BadRequestException('Factor de conversión inválido');
  const unit = unitForSale(p, unitId);
  return roundQty(baseQty / factor, unit.decimalPlaces);
}

export function unitForSale(p: ProductUnitProfile, unitId: string): UnitForQty {
  if (unitId === p.baseUnitId) return p.baseUnit;
  const alt = findAlternate(p, unitId);
  if (alt) return alt.unitOfMeasure;
  throw new BadRequestException('Unidad no válida');
}

export function assertOperationalQuantity(
  qty: number,
  unitId: string,
  p: ProductUnitProfile,
  label = 'Cantidad',
): void {
  assertQuantityForUnit(qty, unitForSale(p, unitId), label);
}

/** Alias histórico */
export function assertSaleQuantity(
  saleQty: number,
  saleUnitId: string,
  p: ProductUnitProfile,
  label = 'Cantidad',
): void {
  assertOperationalQuantity(saleQty, saleUnitId, p, label);
}

export function hasAlternateSaleUnit(p: ProductUnitProfile): boolean {
  return hasAlternateUnits(p);
}

export function productUnitProfileFromRow(row: {
  unitOfMeasureId: string;
  contentPerUnit?: { toNumber?: () => number } | number | string | null;
  contentUnitId?: string | null;
  unitOfMeasure: {
    id: string;
    name: string;
    symbol: string;
    allowsDecimals: boolean;
    decimalPlaces: number;
  };
  contentUnit?: {
    id: string;
    name: string;
    symbol: string;
    allowsDecimals: boolean;
    decimalPlaces: number;
  } | null;
  alternateUnits?: Array<{
    unitOfMeasureId: string;
    factorToBase: { toNumber?: () => number } | number | string;
    label?: string | null;
    unitOfMeasure: {
      id: string;
      name: string;
      symbol: string;
      allowsDecimals: boolean;
      decimalPlaces: number;
    };
  }>;
}): ProductUnitProfile {
  const contentPer =
    row.contentPerUnit === null || row.contentPerUnit === undefined
      ? null
      : qtyToNumber(row.contentPerUnit as never);

  const baseUnit: UnitForQty = {
    allowsDecimals: row.unitOfMeasure.allowsDecimals,
    decimalPlaces: row.unitOfMeasure.decimalPlaces,
    symbol: row.unitOfMeasure.symbol,
    name: row.unitOfMeasure.name,
  };

  const fromDb: AlternateUnitRow[] = (row.alternateUnits ?? []).map((a) => ({
    unitOfMeasureId: a.unitOfMeasureId,
    factorToBase: qtyToNumber(a.factorToBase as never),
    label: a.label ?? null,
    unitOfMeasure: {
      allowsDecimals: a.unitOfMeasure.allowsDecimals,
      decimalPlaces: a.unitOfMeasure.decimalPlaces,
      symbol: a.unitOfMeasure.symbol,
      name: a.unitOfMeasure.name,
    },
  }));

  const legacy: LegacyContentFields = {
    contentPerUnit: contentPer,
    contentUnitId: row.contentUnitId ?? null,
    contentUnit: row.contentUnit
      ? {
          allowsDecimals: row.contentUnit.allowsDecimals,
          decimalPlaces: row.contentUnit.decimalPlaces,
          symbol: row.contentUnit.symbol,
          name: row.contentUnit.name,
        }
      : null,
  };

  return {
    baseUnitId: row.unitOfMeasureId,
    baseUnit,
    alternateUnits: buildAlternateUnits(row.unitOfMeasureId, fromDb, legacy),
  };
}
