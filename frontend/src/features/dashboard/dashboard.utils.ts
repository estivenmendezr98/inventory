const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCop(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return cop.format(0);
  return cop.format(n);
}

export function formatRoleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMINISTRADOR: 'Super administrador',
    ADMINISTRADOR: 'Administrador',
    CAJERO: 'Cajero',
  };
  return map[role] ?? role.replace(/_/g, ' ');
}

export function pctVsYesterday(
  today: number,
  yesterday: number,
): { text: string; type: 'positive' | 'negative' | 'neutral' } {
  if (yesterday <= 0) {
    if (today > 0) return { text: 'Sin base ayer (ayer $0)', type: 'neutral' };
    return { text: 'Sin ventas ayer ni hoy', type: 'neutral' };
  }
  const pct = ((today - yesterday) / yesterday) * 100;
  const rounded = pct.toFixed(1);
  if (pct > 0) return { text: `+${rounded}% vs ayer`, type: 'positive' };
  if (pct < 0) return { text: `${rounded}% vs ayer`, type: 'negative' };
  return { text: 'Igual que ayer', type: 'neutral' };
}

export function formatDashboardDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
