import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiDelete, apiFetch, apiPatch, apiPost } from '../../lib/api';
import { Bell, CheckCheck, Filter, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { emitNotificationsUpdated } from '../../lib/notifications-events';
import {
  NOTIFICATION_MODULE_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '../../lib/notification-routes';
import { NotificationRowView } from '../../components/notifications/NotificationRowView';
import type { NotificationListResponse, NotificationRow } from '../../types/notification';

const TYPE_OPTIONS = ['', 'info', 'success', 'warning', 'error'] as const;
const MODULE_OPTIONS = [
  '',
  'inventory',
  'sales',
  'invoices',
  'purchases',
  'system',
] as const;

export function NotificationsPage() {
  const { hasPermission } = useAuthStore();
  const canView = hasPermission('notifications.view');

  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 30,
    totalPages: 1,
    unreadCount: 0,
  });
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: '30',
    });
    if (unreadOnly) params.set('unreadOnly', 'true');
    if (typeFilter) params.set('type', typeFilter);
    if (moduleFilter) params.set('module', moduleFilter);
    try {
      const res = await apiFetch<NotificationListResponse>(
        `/notifications?${params.toString()}`,
      );
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [canView, page, unreadOnly, typeFilter, moduleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await apiPatch(`/notifications/${id}/read`, {});
      await load();
      emitNotificationsUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  const markAllRead = async () => {
    if (!window.confirm('¿Marcar todas como leídas?')) return;
    try {
      await apiPost('/notifications/read-all', {});
      await load();
      emitNotificationsUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar esta notificación?')) return;
    try {
      await apiDelete(`/notifications/${id}`);
      await load();
      emitNotificationsUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  const clearRead = async () => {
    if (!window.confirm('¿Eliminar todas las notificaciones ya leídas?')) return;
    try {
      await apiDelete('/notifications/read');
      await load();
      emitNotificationsUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  if (!canView) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No tienes permiso para ver notificaciones.</p>
      </div>
    );
  }

  const canClearRead = !unreadOnly && meta.total > meta.unreadCount;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notificaciones</h1>
            <p className="text-sm text-muted-foreground">
              {meta.unreadCount > 0 ? (
                <span>
                  Tienes <strong>{meta.unreadCount}</strong> sin leer.
                </span>
              ) : (
                'Bandeja al día.'
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted/50 disabled:opacity-60"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Actualizar
          </button>
          {meta.unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted/50"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas leídas
            </button>
          )}
          {canClearRead && (
            <button
              type="button"
              onClick={() => void clearRead()}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted/50"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar leídas
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-input"
          />
          Solo sin leer
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Tipo</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-2 py-1.5"
          >
            <option value="">Todos</option>
            {TYPE_OPTIONS.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {NOTIFICATION_TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Módulo</span>
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-2 py-1.5"
          >
            <option value="">Todos</option>
            {MODULE_OPTIONS.filter(Boolean).map((m) => (
              <option key={m} value={m}>
                {NOTIFICATION_MODULE_LABELS[m] ?? m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No hay notificaciones con los filtros seleccionados.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <li key={n.id}>
              <NotificationRowView
                notification={n}
                onMarkRead={markRead}
                onDelete={remove}
              />
            </li>
          ))}
        </ul>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {meta.page} de {meta.totalPages} · {meta.total} en total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-input px-3 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-input px-3 py-1 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
