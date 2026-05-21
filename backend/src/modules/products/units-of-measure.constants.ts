import { UnitCategory } from '@prisma/client';

export interface UnitSeedRow {
  id: string;
  code: string;
  name: string;
  symbol: string;
  category: UnitCategory;
  allowsDecimals: boolean;
  decimalPlaces: number;
  sortOrder: number;
}

/**
 * Solo para migraciones y `prisma db seed`.
 * En runtime el catálogo se lee y escribe en PostgreSQL (`units_of_measure`).
 */
export const UNITS_OF_MEASURE_SEED: UnitSeedRow[] = [
  { id: 'uom-un', code: 'UN', name: 'Unidad / pieza', symbol: 'und', category: 'COUNT', allowsDecimals: false, decimalPlaces: 0, sortOrder: 10 },
  { id: 'uom-par', code: 'PAR', name: 'Par', symbol: 'par', category: 'COUNT', allowsDecimals: false, decimalPlaces: 0, sortOrder: 11 },
  { id: 'uom-cj', code: 'CJ', name: 'Caja', symbol: 'cja', category: 'COUNT', allowsDecimals: false, decimalPlaces: 0, sortOrder: 12 },
  { id: 'uom-kg', code: 'KG', name: 'Kilogramo', symbol: 'kg', category: 'WEIGHT', allowsDecimals: true, decimalPlaces: 3, sortOrder: 20 },
  { id: 'uom-g', code: 'G', name: 'Gramo', symbol: 'g', category: 'WEIGHT', allowsDecimals: true, decimalPlaces: 2, sortOrder: 21 },
  { id: 'uom-lb', code: 'LB', name: 'Libra', symbol: 'lb', category: 'WEIGHT', allowsDecimals: true, decimalPlaces: 3, sortOrder: 22 },
  { id: 'uom-l', code: 'L', name: 'Litro', symbol: 'L', category: 'VOLUME', allowsDecimals: true, decimalPlaces: 3, sortOrder: 30 },
  { id: 'uom-ml', code: 'ML', name: 'Mililitro', symbol: 'mL', category: 'VOLUME', allowsDecimals: true, decimalPlaces: 2, sortOrder: 31 },
  { id: 'uom-m', code: 'M', name: 'Metro', symbol: 'm', category: 'LENGTH', allowsDecimals: true, decimalPlaces: 3, sortOrder: 40 },
  { id: 'uom-cm', code: 'CM', name: 'Centímetro', symbol: 'cm', category: 'LENGTH', allowsDecimals: true, decimalPlaces: 2, sortOrder: 41 },
  { id: 'uom-mm', code: 'MM', name: 'Milímetro', symbol: 'mm', category: 'LENGTH', allowsDecimals: true, decimalPlaces: 1, sortOrder: 42 },
  { id: 'uom-m2', code: 'M2', name: 'Metro cuadrado', symbol: 'm²', category: 'AREA', allowsDecimals: true, decimalPlaces: 3, sortOrder: 50 },
];

export const DEFAULT_UNIT_ID = 'uom-un';
