const UNITS: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86400, divisor: 3600, unit: 'hour' },
  { limit: 604800, divisor: 86400, unit: 'day' },
  { limit: 2592000, divisor: 604800, unit: 'week' },
  { limit: 31536000, divisor: 2592000, unit: 'month' },
  { limit: Infinity, divisor: 31536000, unit: 'year' },
];

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/** Tiempo relativo en español (ej. "hace 5 min"). */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);

  for (const { limit, divisor, unit } of UNITS) {
    if (abs < limit) {
      const value = Math.round(diffSec / divisor);
      return rtf.format(value, unit);
    }
  }
  return rtf.format(Math.round(diffSec / 31536000), 'year');
}
