import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, apiPost, buildApiUrl } from '../../lib/api';
import keycloak from '../../lib/keycloak';
import { Database, Download, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BackupItem {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function downloadBackupFile(filename: string): Promise<void> {
  const token = keycloak.token;
  const headers: HeadersInit = { Accept: 'application/sql' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const url = buildApiUrl(`/backups/files/${encodeURIComponent(filename)}`);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export function BackupsPage() {
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('backups.create');

  const [items, setItems] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canCreate) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<BackupItem[]>('/backups');
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar respaldos');
    } finally {
      setLoading(false);
    }
  }, [canCreate]);

  useEffect(() => {
    void load();
  }, [load]);

  const createBackup = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    try {
      await apiPost<BackupItem>('/backups/database', {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar respaldo');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (filename: string) => {
    if (!canCreate) return;
    if (!window.confirm(`¿Eliminar el archivo ${filename}?`)) return;
    setError(null);
    try {
      const token = keycloak.token;
      const headers: HeadersInit = {};
      if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      const res = await fetch(buildApiUrl(`/backups/files/${encodeURIComponent(filename)}`), {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  if (!canCreate) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No tienes permiso para gestionar respaldos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-7 w-7 text-primary" />
            Respaldos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Genera y descarga volcados SQL de la base de aplicación (
            <code className="rounded bg-muted px-1 text-xs">inventory_bd</code>).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => void createBackup()}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            {creating ? 'Generando…' : 'Nuevo respaldo SQL'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">Archivos en el servidor</div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No hay respaldos aún. Pulsa «Nuevo respaldo SQL».
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Archivo</th>
                  <th className="px-4 py-2 font-medium">Tamaño</th>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium w-40">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.filename} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{row.filename}</td>
                    <td className="px-4 py-2">{formatBytes(row.sizeBytes)}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Descargar"
                          onClick={() =>
                            void downloadBackupFile(row.filename).catch((e) =>
                              setError(e instanceof Error ? e.message : 'Error al descargar'),
                            )
                          }
                          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => void remove(row.filename)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
