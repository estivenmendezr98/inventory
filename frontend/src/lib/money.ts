/** Pesos colombianos: solo valores enteros (sin centavos). */

export const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function roundCop(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

/** Parsea entrada de dinero: acepta "1000", "1.000", "1'000.000", etc. */
export function parseCopInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) || 0;
}

export function parsePercentInput(raw: string): number {
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** Solo dígitos mientras se escribe (miles sin decimales). */
export function sanitizeCopDraft(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return String(parseInt(digits, 10));
}
