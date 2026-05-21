import { apiFetch, apiPost } from './api';

export interface UnitOfMeasureDto {
  id: string;
  code: string;
  name: string;
  symbol: string;
  category: string;
  categoryLabel: string;
  allowsDecimals: boolean;
  decimalPlaces: number;
}

export interface UnitsOfMeasureResponse {
  /** Id de la unidad por defecto (tabla `units_of_measure`, código UN). */
  defaultUnitId: string;
  units: UnitOfMeasureDto[];
  grouped: Array<{
    category: string;
    categoryLabel: string;
    units: UnitOfMeasureDto[];
  }>;
}

export const UNIT_CATEGORY_OPTIONS = [
  { value: 'COUNT', label: 'Conteo (piezas, cajas)' },
  { value: 'LENGTH', label: 'Longitud (metro, cm)' },
  { value: 'VOLUME', label: 'Volumen (litro, mL)' },
  { value: 'WEIGHT', label: 'Peso (kg, g)' },
  { value: 'AREA', label: 'Superficie (m²)' },
] as const;

/** Catálogo desde API (PostgreSQL). */
export async function fetchUnitsOfMeasure(): Promise<UnitsOfMeasureResponse> {
  return apiFetch<UnitsOfMeasureResponse>('/products/options/units-of-measure');
}

export async function createUnitOfMeasureInDb(body: {
  code: string;
  name: string;
  symbol: string;
  category: string;
  allowsDecimals?: boolean;
  decimalPlaces?: number;
}): Promise<UnitOfMeasureDto> {
  return apiPost<UnitOfMeasureDto>('/products/options/units-of-measure', body);
}

export function qtyInputStep(unit: UnitOfMeasureDto | null | undefined): string {
  if (!unit?.allowsDecimals) return '1';
  if (unit.decimalPlaces <= 1) return '0.1';
  if (unit.decimalPlaces === 2) return '0.01';
  return '0.001';
}

/** Solo el número, sin unidad (use columna U.M. aparte). */
export function formatQtyNumber(
  qty: number,
  unit: UnitOfMeasureDto | { decimalPlaces: number; allowsDecimals?: boolean } | null | undefined,
): string {
  const dp = unit?.decimalPlaces ?? 0;
  const allowsDecimals = unit?.allowsDecimals ?? dp > 0;
  if (!allowsDecimals) return String(Math.round(qty));
  return qty.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: dp,
  });
}

export function formatUnitSymbol(unit: UnitOfMeasureDto | null | undefined): string {
  return unit?.symbol ?? '—';
}

/** @deprecated Preferir formatQtyNumber + formatUnitSymbol en tablas. */
export function formatQtyWithUnit(qty: number, unit: UnitOfMeasureDto | null | undefined): string {
  if (!unit) return formatQtyNumber(qty, null);
  return `${formatQtyNumber(qty, unit)} ${formatUnitSymbol(unit)}`;
}

export function roundQtyForUnit(
  qty: number,
  unit: UnitOfMeasureDto | { decimalPlaces: number } | null | undefined
): number {
  const dp = unit?.decimalPlaces ?? 0;
  const factor = 10 ** dp;
  return Math.round(qty * factor) / factor;
}

export function parseQtyInput(raw: string, fallback: number): number {
  const n = parseFloat(raw.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

export function minQtyForUnit(unit: UnitOfMeasureDto | null | undefined): number {
  if (!unit?.allowsDecimals) return 1;
  if (unit.decimalPlaces <= 1) return 0.1;
  if (unit.decimalPlaces === 2) return 0.01;
  return 0.001;
}

export function validateQtyForUnit(
  qty: number,
  unit: UnitOfMeasureDto | null | undefined,
  label = 'Cantidad'
): string | null {
  if (!Number.isFinite(qty) || qty <= 0) {
    return `${label} debe ser mayor que cero`;
  }
  const rounded = roundQtyForUnit(qty, unit);
  if (Math.abs(qty - rounded) > 1e-9) {
    return `${label} admite máximo ${unit?.decimalPlaces ?? 0} decimal(es)`;
  }
  if (unit && !unit.allowsDecimals && !Number.isInteger(qty)) {
    return `${label} debe ser entera (${unit.symbol})`;
  }
  return null;
}
