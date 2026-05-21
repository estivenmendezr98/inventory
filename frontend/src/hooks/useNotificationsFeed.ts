import { useCallback, useEffect, useState } from 'react';
import { apiFetch, apiPatch, apiPost } from '../lib/api';
import {
  emitNotificationsUpdated,
  NOTIFICATIONS_UPDATED_EVENT,
} from '../lib/notifications-events';
import type { NotificationRow } from '../types/notification';

export function useUnreadNotificationCount(enabled: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setUnreadCount(0);
      setLoadError(null);
      return;
    }
    try {
      const r = await apiFetch<{ unreadCount: number }>('/notifications/unread-count');
      setUnreadCount(r.unreadCount);
      setLoadError(null);
    } catch (e) {
      setUnreadCount(0);
      setLoadError(e instanceof Error ? e.message : 'No se pudo cargar notificaciones');
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    const onUpdated = () => void refresh();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
    };
  }, [refresh]);

  return { unreadCount, loadError, refreshUnreadCount: refresh };
}

export function useRecentNotifications(enabled: boolean, limit = 8) {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch<{ data: NotificationRow[] }>(
        `/notifications/recent?limit=${limit}`,
      );
      setItems(r.data);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [enabled, limit]);

  useEffect(() => {
    void refresh();
    const onUpdated = () => void refresh();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      try {
        await apiPatch(`/notifications/${id}/read`, {});
        emitNotificationsUpdated();
      } catch {
        await refresh();
      }
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiPost('/notifications/read-all', {});
      emitNotificationsUpdated();
      await refresh();
    } catch {
      await refresh();
    }
  }, [refresh]);

  return { items, loading, error, refresh, markRead, markAllRead };
}
