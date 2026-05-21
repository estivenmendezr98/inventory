import { Link } from 'react-router-dom';
import { Check, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/relative-time';
import {
  getNotificationHref,
  NOTIFICATION_MODULE_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '../../lib/notification-routes';
import {
  notificationTypeClasses,
  notificationTypeDotClass,
  notificationTypeIcon,
} from '../../lib/notification-styles';
import type { NotificationRow } from '../../types/notification';

interface NotificationRowViewProps {
  notification: NotificationRow;
  compact?: boolean;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onNavigate?: () => void;
}

export function NotificationRowView({
  notification: n,
  compact = false,
  onMarkRead,
  onDelete,
  onNavigate,
}: NotificationRowViewProps) {
  const href = getNotificationHref(n.module, n.entityId);
  const Icon = notificationTypeIcon(n.type);
  const moduleLabel = n.module ? NOTIFICATION_MODULE_LABELS[n.module] ?? n.module : null;
  const typeLabel = NOTIFICATION_TYPE_LABELS[n.type] ?? n.type;

  const body = (
    <div
      className={cn(
        'flex gap-3 rounded-lg border p-3 transition-colors',
        notificationTypeClasses(n.type),
        !n.isRead && 'ring-1 ring-primary/30',
        n.isRead && 'opacity-80',
        compact && 'p-2.5',
      )}
    >
      <div className="relative mt-0.5 shrink-0">
        <Icon className={cn('text-muted-foreground', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        {!n.isRead && (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full',
              notificationTypeDotClass(n.type),
            )}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className={cn('font-medium leading-snug', compact ? 'text-sm' : 'text-base')}>
            {n.title}
          </p>
          {!n.isRead && (
            <span className="rounded-full bg-primary px-1.5 py-0 text-[10px] font-semibold text-primary-foreground">
              Nueva
            </span>
          )}
        </div>
        <p
          className={cn(
            'mt-0.5 whitespace-pre-wrap text-muted-foreground',
            compact ? 'line-clamp-2 text-xs' : 'text-sm',
          )}
        >
          {n.message}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <time dateTime={n.createdAt} title={new Date(n.createdAt).toLocaleString('es-CO')}>
            {formatRelativeTime(n.createdAt)}
          </time>
          <span aria-hidden>·</span>
          <span>{typeLabel}</span>
          {moduleLabel && (
            <>
              <span aria-hidden>·</span>
              <span>{moduleLabel}</span>
            </>
          )}
        </p>
        {href && !compact && (
          <p className="mt-1 text-xs text-primary">Toca para abrir el detalle</p>
        )}
      </div>
      {(onMarkRead || onDelete) && (
        <div className="flex shrink-0 flex-col gap-0.5">
          {!n.isRead && onMarkRead && (
            <button
              type="button"
              title="Marcar como leída"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void onMarkRead(n.id);
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              title="Eliminar"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void onDelete(n.id);
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        to={href}
        onClick={() => {
          if (!n.isRead) void onMarkRead?.(n.id);
          onNavigate?.();
        }}
        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
        {compact && <span className="sr-only">, abrir detalle</span>}
      </Link>
    );
  }

  if (!n.isRead && onMarkRead) {
    return (
      <button
        type="button"
        onClick={() => void onMarkRead(n.id)}
        className="block w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
      </button>
    );
  }

  return body;
}

export function NotificationOpenLink({
  module,
  entityId,
  className,
}: {
  module: string | null;
  entityId: string | null;
  className?: string;
}) {
  const href = getNotificationHref(module, entityId);
  if (!href) return null;
  return (
    <Link
      to={href}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline',
        className,
      )}
    >
      Ver detalle
      <ExternalLink className="h-3 w-3" />
    </Link>
  );
}
