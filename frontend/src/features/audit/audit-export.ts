import { buildApiUrl } from '../../lib/api';
import keycloak from '../../lib/keycloak';
import type { AuditFilterState } from './components/AuditFilters';

function parseFilenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
  if (m?.[1]) return decodeURIComponent(m[1].replace(/"/g, '').trim());
  return fallback;
}

export function buildExportQuery(filters: AuditFilterState, format: 'csv' | 'pdf'): string {
  const params = new URLSearchParams({ format });
  if (filters.module.trim()) params.set('module', filters.module.trim());
  if (filters.action.trim()) params.set('action', filters.action.trim());
  if (filters.entityType.trim()) params.set('entityType', filters.entityType.trim());
  if (filters.entityId.trim()) params.set('entityId', filters.entityId.trim());
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.from.trim()) params.set('from', filters.from.trim());
  if (filters.to.trim()) params.set('to', filters.to.trim());
  if (filters.severity.trim()) params.set('severity', filters.severity.trim());
  if (filters.operation.trim()) params.set('operation', filters.operation.trim());
  return params.toString();
}

export async function downloadAuditExport(
  filters: AuditFilterState,
  format: 'csv' | 'pdf',
): Promise<void> {
  if (!filters.from.trim() || !filters.to.trim()) {
    throw new Error('Indique fecha desde y hasta para generar el informe legal.');
  }
  const qs = buildExportQuery(filters, format);
  const url = buildApiUrl(`/audit/export?${qs}`);
  const token = keycloak.token;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    try {
      const j = JSON.parse(text) as { message?: string | string[] };
      if (typeof j.message === 'string') throw new Error(j.message);
      if (Array.isArray(j.message)) throw new Error(j.message.join(', '));
    } catch (e) {
      if (e instanceof Error && e.message !== text) throw e;
    }
    throw new Error(text || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const fallback = format === 'pdf' ? 'auditoria_legal.pdf' : 'auditoria_legal.csv';
  const filename = parseFilenameFromDisposition(res.headers.get('Content-Disposition'), fallback);
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}
