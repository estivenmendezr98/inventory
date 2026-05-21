import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NOTIFICATIONS_UPDATED_EVENT } from '../../lib/notifications-events';
import {
  useRecentNotifications,
  useUnreadNotificationCount,
} from '../../hooks/useNotificationsFeed';
import { NotificationRowView } from './NotificationRowView';

interface NotificationBellProps {
  enabled: boolean;
}

export function NotificationBell({ enabled }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { unreadCount, loadError, refreshUnreadCount } = useUnreadNotificationCount(enabled);
  const { items, loading, error, refresh, markRead, markAllRead } = useRecentNotifications(
    enabled,
    8,
  );

  useEffect(() => {
    if (!enabled) return;
    const onUpdated = () => {
      void refreshUnreadCount();
      void refresh();
    };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
  }, [enabled, refresh, refreshUnreadCount]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && enabled) void refresh();
  }, [open, enabled, refresh]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    await refreshUnreadCount();
  };

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          open && 'bg-accent text-accent-foreground',
        )}
        title={loadError ? `Notificaciones — ${loadError}` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : 'Notificaciones, al día'
        }
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[100] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notificaciones</p>
              <p className="text-xs text-muted-foreground">
                {loadError
                  ? loadError
                  : unreadCount > 0
                    ? `${unreadCount} sin leer`
                    : 'Al día'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Leídas
              </button>
            )}
          </div>

          <div className="max-h-[min(20rem,50vh)] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </div>
            ) : error ? (
              <p className="px-2 py-6 text-center text-sm text-destructive">{error}</p>
            ) : items.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                No tienes notificaciones recientes.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((n) => (
                  <li key={n.id}>
                    <NotificationRowView
                      notification={n}
                      compact
                      onMarkRead={markRead}
                      onNavigate={() => setOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border p-2">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block w-full rounded-md bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary hover:bg-primary/15"
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
