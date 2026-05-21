import { Prisma } from '@prisma/client';

export type UnitForQty = {
  allowsDecimals: boolean;
  decimalPlaces: number;
  symbol?: string;
  name?: string;
};

export function toQtyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(roundQty(value, 4).toFixed(4));
}

export function qtyToNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Prisma.Decimal) return Number(value);
  return Number(value);
}

export function roundQty(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;
  return Math.round(value * factor) / factor;
}

export function formatQty(value: number, unit: UnitForQty): string {
  const n = roundQty(value, unit.decimalPlaces);
  const formatted = unit.allowsDecimals
    ? n.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: unit.decimalPlaces,
      })
    : String(Math.round(n));
  return unit.symbol ? `${formatted} ${unit.symbol}` : formatted;
}

export function assertQuantityForUnit(
  quantity: number,
  unit: UnitForQty,
  fieldLabel = 'Cantidad',
): void {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`${fieldLabel} debe ser mayor que cero`);
  }
  const rounded = roundQty(quantity, unit.decimalPlaces);
  if (Math.abs(quantity - rounded) > 1e-9) {
    throw new Error(
      `${fieldLabel} admite máximo ${unit.decimalPlaces} decimal(es) para la unidad ${unit.symbol ?? ''}`.trim(),
    );
  }
  if (!unit.allowsDecimals && !Number.isInteger(quantity)) {
    throw new Error(`${fieldLabel} debe ser un número entero (unidad: ${unit.symbol ?? 'und'})`);
  }
}

export const UNIT_CATEGORY_LABELS: Record<string, string> = {
  COUNT: 'Conteo (piezas, cajas)',
  LENGTH: 'Longitud (metro, centímetro)',
  VOLUME: 'Volumen (litro, mililitro)',
  WEIGHT: 'Peso (kilogramo, gramo)',
  AREA: 'Superficie (metro cuadrado)',
};
