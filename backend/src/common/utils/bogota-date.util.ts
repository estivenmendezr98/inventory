/** Límites de día calendario en America/Bogota (UTC-5, sin DST). */
const TZ_OFFSET = '-05:00';

export function bogotaYmd(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

export function bogotaDayBounds(reference: Date = new Date()): { start: Date; end: Date } {
  const ymd = bogotaYmd(reference);
  return {
    start: new Date(`${ymd}T00:00:00.000${TZ_OFFSET}`),
    end: new Date(`${ymd}T23:59:59.999${TZ_OFFSET}`),
  };
}

export function bogotaDayBoundsFromYmd(ymd: string): { start: Date; end: Date } {
  return {
    start: new Date(`${ymd}T00:00:00.000${TZ_OFFSET}`),
    end: new Date(`${ymd}T23:59:59.999${TZ_OFFSET}`),
  };
}

export function bogotaYesterdayBounds(reference: Date = new Date()): { start: Date; end: Date } {
  const ymd = addDaysToYmd(bogotaYmd(reference), -1);
  return {
    start: new Date(`${ymd}T00:00:00.000${TZ_OFFSET}`),
    end: new Date(`${ymd}T23:59:59.999${TZ_OFFSET}`),
  };
}

/** Inicio del día calendario en Bogotá hace N días (0 = hoy). */
export function bogotaDayStartDaysAgo(days: number, reference: Date = new Date()): Date {
  const ymd = addDaysToYmd(bogotaYmd(reference), -days);
  return new Date(`${ymd}T00:00:00.000${TZ_OFFSET}`);
}

export function bogotaMonthStart(reference: Date = new Date()): Date {
  const ymd = bogotaYmd(reference);
  const [y, m] = ymd.split('-');
  return new Date(`${y}-${m}-01T00:00:00.000${TZ_OFFSET}`);
}
