import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import type { NotificationPayload } from '../notifications/notification.types';

export type InventoryUpdatedPayload = {
  productId: string;
  quantity: number;
  sku?: string;
};

/**
 * Emite eventos Socket.IO desde servicios HTTP (p. ej. ajuste de inventario).
 * El `Server` lo asigna `RealtimeGateway` tras inicializar el gateway.
 */
@Injectable()
export class RealtimeBroadcastService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitInventoryUpdated(payload: InventoryUpdatedPayload) {
    this.server?.emit('inventory:updated', payload);
  }

  emitNotificationNew(userId: string, payload: NotificationPayload) {
    this.server?.to(`user:${userId}`).emit('notification:new', payload);
  }
}
