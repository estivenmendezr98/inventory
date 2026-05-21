import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import keycloak from '../lib/keycloak';
import { buildSocketBaseUrl } from '../lib/socket-base';
import { emitNotificationsUpdated } from '../lib/notifications-events';
import type { NotificationRow } from '../types/notification';

/**
 * Conexión autenticada a Socket.IO; invalida caches y refresca notificaciones al recibir eventos.
 */
export function useRealtimeConnection(enabled: boolean) {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !keycloak.token) return;

    const base = buildSocketBaseUrl();
    if (!base) return;

    const connect = () => {
      socketRef.current?.close();
      const socket = io(base, {
        path: '/socket.io',
        auth: { token: `Bearer ${keycloak.token}` },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      const onInventoryUpdated = () => {
        void qc.invalidateQueries({ queryKey: ['pos', 'products'] });
        void qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
        void qc.invalidateQueries({ queryKey: ['inventory', 'list'] });
      };

      const onNotificationNew = (_payload: NotificationRow) => {
        emitNotificationsUpdated();
      };

      socket.on('inventory:updated', onInventoryUpdated);
      socket.on('notification:new', onNotificationNew);
    };

    connect();

    const prevOnRefresh = keycloak.onAuthRefreshSuccess;
    keycloak.onAuthRefreshSuccess = () => {
      prevOnRefresh?.();
      connect();
    };

    return () => {
      const socket = socketRef.current;
      if (socket) {
        socket.removeAllListeners();
        socket.close();
      }
      socketRef.current = null;
      if (keycloak.onAuthRefreshSuccess) {
        keycloak.onAuthRefreshSuccess = prevOnRefresh;
      }
    };
  }, [enabled, keycloak.token, qc]);
}
