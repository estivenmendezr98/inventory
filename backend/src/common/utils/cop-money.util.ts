/** Pesos colombianos: montos enteros sin centavos. */
export function roundCop(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}
