import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiDelete, apiFetch, buildApiUrl } from '../../lib/api';
import keycloak from '../../lib/keycloak';
import { Download, FileText, Search, Trash2, Upload } from 'lucide-react';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export interface DocumentRow {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  module: string;
  entityId: string | null;
  createdAt: string;
  uploadedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface ListResponse {
  data: DocumentRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const MODULE_PRESETS = [
  { value: 'general', label: 'General' },
  { value: 'products', label: 'Productos' },
  { value: 'purchases', label: 'Compras' },
  { value: 'sales', label: 'Ventas' },
  { value: 'invoices', label: 'Ticket / Comprobante local' },
  { value: 'suppliers', label: 'Proveedores' },
  { value: 'customers', label: 'Clientes' },
  { value: 'inventory', label: 'Inventario' },
  { value: 'pos', label: 'POS' },
  { value: 'settings', label: 'Configuración' },
];

async function downloadDocumentFile(id: string, displayName: string): Promise<void> {
  const token = keycloak.token;
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const url = buildApiUrl(`/documents/${id}/file`);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = displayName || 'documento';
  a.click();
  URL.revokeObjectURL(href);
}

async function uploadDocumentFile(
  file: File,
  module: string,
  entityId: string,
): Promise<DocumentRow> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('module', module);
  if (entityId.trim()) fd.append('entityId', entityId.trim());
  const token = keycloak.token;
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(buildApiUrl('/documents'), {
    method: 'POST',
    headers,
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json() as Promise<DocumentRow>;
}

export function DocumentsPage() {
  const { hasPermission, user } = useAuthStore();
  const canView = hasPermission('documents.view');
  const canUpload = hasPermission('documents.upload');
  const canDelete = hasPermission('documents.delete');

  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [uploadModule, setUploadModule] = useState('general');
  const [uploadEntityId, setUploadEntityId] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, moduleFilter]);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (moduleFilter) params.set('module', moduleFilter);
    try {
      const res = await apiFetch<ListResponse>(`/documents?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, moduleFilter, canView]);

  useEffect(() => {
    void load();
  }, [load, user?.id]);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canUpload) return;
    setUploadBusy(true);
    setError(null);
    try {
      await uploadDocumentFile(file, uploadModule, uploadEntityId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploadBusy(false);
    }
  };

  if (!canView) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No tienes permiso para ver documentos.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Documentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Archivos adjuntos por módulo. Descarga con permiso de ver; subida y borrado según rol.
          </p>
        </div>
        {canUpload && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="text-xs text-muted-foreground sm:w-40">
              Módulo
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={uploadModule}
                onChange={(ev) => setUploadModule(ev.target.value)}
                disabled={uploadBusy}
              >
                {MODULE_PRESETS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground sm:w-56">
              ID entidad (opcional, UUID)
              <input
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
                placeholder="00000000-0000-..."
                value={uploadEntityId}
                onChange={(ev) => setUploadEntityId(ev.target.value)}
                disabled={uploadBusy}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Upload className="h-4 w-4" />
              {uploadBusy ? 'Subiendo…' : 'Subir archivo'}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.csv,.txt,.doc,.docx,.xls,.xlsx"
                disabled={uploadBusy}
                onChange={onPickFile}
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por nombre…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm sm:w-48"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="">Todos los módulos</option>
          {MODULE_PRESETS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium">Nombre</th>
                  <th className="text-left p-3 font-medium">Módulo</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Tipo</th>
                  <th className="text-right p-3 font-medium">Tamaño</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Subido por</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Fecha</th>
                  <th className="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No hay documentos. {canUpload ? 'Sube un archivo con el botón superior.' : ''}
                    </td>
                  </tr>
                ) : (
                  rows.map((d) => (
                    <tr key={d.id} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="p-3 font-medium max-w-[200px] truncate" title={d.name}>
                        {d.name}
                      </td>
                      <td className="p-3 text-muted-foreground">{d.module}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{d.type}</td>
                      <td className="p-3 text-right tabular-nums">{formatBytes(d.size)}</td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell text-xs">
                        {d.uploadedBy.firstName} {d.uploadedBy.lastName}
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell text-xs whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleString('es-CO')}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Descargar"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={() =>
                              downloadDocumentFile(d.id, d.name).catch((err) =>
                                setError(err instanceof Error ? err.message : 'Error al descargar'),
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              title="Eliminar"
                              className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (!window.confirm(`¿Eliminar «${d.name}» del sistema?`)) return;
                                apiDelete(`/documents/${d.id}`)
                                  .then(() => load())
                                  .catch((err) =>
                                    setError(err instanceof Error ? err.message : 'Error al eliminar'),
                                  );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
              <span>
                Página {meta.page} de {meta.totalPages} ({meta.total} documentos)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-border px-2 py-1 disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="rounded border border-border px-2 py-1 disabled:opacity-40"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
