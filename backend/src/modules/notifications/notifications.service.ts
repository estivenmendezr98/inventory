import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getSeedPermissionsForRole } from '../../auth/role-seed-permissions';
import { RealtimeBroadcastService } from '../realtime/realtime-broadcast.service';
import { qtyToNumber } from '../../common/utils/product-quantity.util';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import type { NotificationPayload } from './notification.types';

const LOW_STOCK_DEDUPE_HOURS = 24;
const LOW_STOCK_SYNC_MAX = 15;

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeBroadcastService,
  ) {}

  /** Evita escanear stock bajo en cada request del header. */
  private readonly lowStockSyncAt = new Map<string, number>();

  async onModuleInit() {
    await this.purgeLegacyWelcomeNotifications();
  }

  /** Elimina mensajes de bienvenida automáticos (ya no se generan). */
  private async purgeLegacyWelcomeNotifications() {
    await this.prisma.notification.deleteMany({
      where: {
        module: 'system',
        OR: [
          { title: 'Bienvenido al sistema' },
          { title: 'Bienvenido' },
        ],
      },
    });
  }

  private mapRow(n: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    module: string | null;
    entityId: string | null;
    createdAt: Date;
  }): NotificationPayload {
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      module: n.module,
      entityId: n.entityId,
      createdAt: n.createdAt.toISOString(),
    };
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  async findRecentForUser(userId: string, limit = 8): Promise<{ data: NotificationPayload[] }> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { data: rows.map((n) => this.mapRow(n)) };
  }

  async findAllForUser(userId: string, query: QueryNotificationsDto) {
    await this.ensureInboxForUser(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(query.unreadOnly ? { isRead: false } : {}),
      ...(query.type?.trim() ? { type: query.type.trim() } : {}),
      ...(query.module?.trim() ? { module: query.module.trim() } : {}),
    };

    const [total, rows, unreadCount] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data: rows.map((n) => this.mapRow(n)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        unreadCount,
      },
    };
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!n) throw new NotFoundException('Notificación no encontrada');
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async remove(userId: string, id: string) {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!n) throw new NotFoundException('Notificación no encontrada');
    await this.prisma.notification.delete({ where: { id } });
    return { ok: true };
  }

  async removeAllRead(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return { ok: true, deleted: result.count };
  }

  /** Para uso desde otros servicios (ventas, stock bajo, etc.). */
  async createForUser(
    userId: string,
    payload: {
      title: string;
      message: string;
      type?: string;
      module?: string | null;
      entityId?: string | null;
    },
    options?: { skipRealtime?: boolean },
  ) {
    const row = await this.prisma.notification.create({
      data: {
        userId,
        title: payload.title.trim(),
        message: payload.message.trim(),
        type: payload.type?.trim() || 'info',
        module: payload.module?.trim() || null,
        entityId: payload.entityId?.trim() || null,
      },
    });
    const mapped = this.mapRow(row);
    if (!options?.skipRealtime) {
      this.realtime.emitNotificationNew(userId, mapped);
    }
    return row;
  }

  /**
   * Genera alertas de stock bajo pendientes (productos ya bajo mínimo sin aviso reciente).
   * Se ejecuta como máximo una vez cada 5 minutos por usuario.
   */
  async syncLowStockAlertsForUser(userId: string) {
    const now = Date.now();
    const last = this.lowStockSyncAt.get(userId) ?? 0;
    if (now - last < 5 * 60 * 1000) return;
    this.lowStockSyncAt.set(userId, now);

    const rows = await this.prisma.inventory.findMany({
      where: {
        product: { isActive: true, minStock: { gt: 0 } },
      },
      include: {
        product: { select: { id: true, sku: true, name: true, minStock: true } },
      },
      take: 200,
    });

    let created = 0;
    for (const row of rows) {
      if (created >= LOW_STOCK_SYNC_MAX) break;
      const qty = qtyToNumber(row.quantity);
      const minS = qtyToNumber(row.product.minStock);
      if (qty >= minS) continue;
      const dup = await this.hasRecentDuplicate(userId, 'inventory', row.product.id, 'warning');
      if (dup) continue;
      await this.createForUser(userId, {
        title: `Stock bajo: ${row.product.sku}`,
        message: `${row.product.name}\nStock actual: ${qty} · mínimo: ${minS}. Revisa inventario o realiza una compra.`,
        type: 'warning',
        module: 'inventory',
        entityId: row.product.id,
      });
      created += 1;
    }
  }

  private async ensureInboxForUser(userId: string) {
    await this.syncLowStockAlertsForUser(userId);
  }

  private async userIdsWithPermission(permissionCode: string): Promise<string[]> {
    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
      select: { id: true },
    });

    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        role: {
          select: {
            name: true,
            rolePermissions: permission
              ? { where: { permissionId: permission.id }, select: { permissionId: true } }
              : { select: { permissionId: true } },
          },
        },
      },
    });

    const ids: string[] = [];
    for (const u of users) {
      if (!u.role) continue;
      if (u.role.name === RoleName.SUPER_ADMINISTRADOR) {
        ids.push(u.id);
        continue;
      }
      const seed = getSeedPermissionsForRole(u.role.name);
      const hasDb = permission
        ? u.role.rolePermissions.length > 0
        : false;
      if (hasDb || seed.includes(permissionCode)) {
        ids.push(u.id);
      }
    }
    return [...new Set(ids)];
  }

  private async hasRecentDuplicate(
    userId: string,
    module: string,
    entityId: string,
    type: string,
  ): Promise<boolean> {
    const since = new Date(Date.now() - LOW_STOCK_DEDUPE_HOURS * 60 * 60 * 1000);
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        module,
        entityId,
        type,
        isRead: false,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    return !!existing;
  }

  async notifyLowStock(productId: string, sku: string, productName: string, qty: number, minStock: number) {
    const userIds = await this.userIdsWithPermission('notifications.view');
    const message = `Stock actual: ${qty} · mínimo: ${minStock}. Revisa inventario o realiza una compra.`;

    await Promise.all(
      userIds.map(async (userId) => {
        const dup = await this.hasRecentDuplicate(userId, 'inventory', productId, 'warning');
        if (dup) return;
        await this.createForUser(userId, {
          title: `Stock bajo: ${sku}`,
          message: `${productName}\n${message}`,
          type: 'warning',
          module: 'inventory',
          entityId: productId,
        });
      }),
    );
  }

  async maybeNotifyLowStockAfterChange(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        sku: true,
        name: true,
        minStock: true,
        inventory: { select: { quantity: true } },
      },
    });
    if (!product) return;
    const minS = qtyToNumber(product.minStock);
    if (minS <= 0) return;
    const qty = product.inventory[0] ? qtyToNumber(product.inventory[0].quantity) : 0;
    if (qty >= minS) return;
    await this.notifyLowStock(product.id, product.sku, product.name, qty, minS);
  }

  async notifySaleCompleted(
    saleId: string,
    saleNumber: string,
    total: string,
    cashierUserId: string,
  ) {
    const userIds = await this.userIdsWithPermission('notifications.view');
    const message = `Venta ${saleNumber} registrada por ${total}.`;

    await Promise.all(
      userIds.map(async (userId) => {
        if (userId === cashierUserId) return;
        const dup = await this.hasRecentDuplicate(userId, 'sales', saleId, 'success');
        if (dup) return;
        await this.createForUser(userId, {
          title: `Nueva venta ${saleNumber}`,
          message,
          type: 'success',
          module: 'sales',
          entityId: saleId,
        });
      }),
    );
  }
}
