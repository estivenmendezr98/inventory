const TZ = 'America/Bogota';

export type ReportPresetId =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | `months-${number}`
  | 'custom';

export interface ReportDateRange {
  from: string;
  to: string;
  label: string;
}

export function bogotaTodayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function addMonthsYmd(ymd: string, months: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  let month = m - 1 + months;
  let year = y;
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const REPORT_PRESET_OPTIONS: Array<{ id: ReportPresetId; label: string }> = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana (7 días)' },
  { id: 'month', label: 'Mes actual' },
  ...([2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const).map((n) => ({
    id: `months-${n}` as ReportPresetId,
    label: `${n} meses`,
  })),
  { id: 'year', label: '1 año' },
];

export function rangeForPreset(preset: Exclude<ReportPresetId, 'custom'>): ReportDateRange {
  const today = bogotaTodayYmd();
  const [y, m] = today.split('-');

  switch (preset) {
    case 'today':
      return { from: today, to: today, label: 'Hoy' };
    case 'week':
      return { from: addDaysYmd(today, -6), to: today, label: 'Últimos 7 días' };
    case 'month':
      return { from: `${y}-${m}-01`, to: today, label: 'Mes en curso' };
    case 'year':
      return { from: addMonthsYmd(today, -12), to: today, label: 'Último año (12 meses)' };
    default: {
      if (preset.startsWith('months-')) {
        const n = Number(preset.slice(7));
        if (n >= 2 && n <= 11) {
          return {
            from: addMonthsYmd(today, -n),
            to: today,
            label: `Últimos ${n} meses`,
          };
        }
      }
      return { from: addDaysYmd(today, -29), to: today, label: 'Últimos 30 días' };
    }
  }
}

export function defaultReportRange(): ReportDateRange {
  return rangeForPreset('month');
}
