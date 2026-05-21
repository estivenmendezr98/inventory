import { Injectable, NotFoundException } from '@nestjs/common';
import { KardexType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { AuditService } from '../audit/audit.service';
import { RealtimeBroadcastService } from '../realtime/realtime-broadcast.service';
import { NotificationsService } from '../notifications/notifications.service';
import { qtyToNumber, toQtyDecimal } from '../../common/utils/product-quantity.util';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeBroadcastService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: QueryInventoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = {
      product: {
        isActive: true,
        ...(query.search?.trim() && {
          OR: [
            { name: { contains: query.search.trim(), mode: 'insensitive' } },
            { sku: { contains: query.search.trim(), mode: 'insensitive' } },
            { barcode: { contains: query.search.trim(), mode: 'insensitive' } },
          ],
        }),
      },
    };

    const productInclude = {
      select: {
        id: true,
        sku: true,
        name: true,
        minStock: true,
        maxStock: true,
        costPrice: true,
        category: { select: { id: true, name: true } },
        unitOfMeasure: {
          select: { symbol: true, name: true, decimalPlaces: true, allowsDecimals: true },
        },
      },
    };

    const mapRow = (r: {
      id: string;
      productId: string;
      quantity: Prisma.Decimal;
      reservedQty: Prisma.Decimal;
      product: {
        id: string;
        sku: string;
        name: string;
        minStock: Prisma.Decimal;
        maxStock: Prisma.Decimal;
        costPrice: Prisma.Decimal;
        category: { id: string; name: string } | null;
        unitOfMeasure: {
          symbol: string;
          name: string;
          decimalPlaces: number;
          allowsDecimals: boolean;
        };
      };
    }) => {
      const qty = qtyToNumber(r.quantity);
      const reserved = qtyToNumber(r.reservedQty);
      const minS = qtyToNumber(r.product.minStock);
      return {
        id: r.id,
        productId: r.productId,
        quantity: qty,
        reservedQty: reserved,
        available: Math.max(0, qty - reserved),
        lowStock: minS > 0 && qty < minS,
        product: {
          sku: r.product.sku,
          name: r.product.name,
          minStock: minS,
          maxStock: qtyToNumber(r.product.maxStock),
          costPrice: r.product.costPrice.toString(),
          category: r.product.category,
          unitSymbol: r.product.unitOfMeasure.symbol,
          unitName: r.product.unitOfMeasure.name,
          unitDecimalPlaces: r.product.unitOfMeasure.decimalPlaces,
          unitAllowsDecimals: r.product.unitOfMeasure.allowsDecimals,
        },
      };
    };

    if (query.lowStockOnly) {
      const rows = await this.prisma.inventory.findMany({
        where: {
          ...where,
          product: { ...(where.product as object), minStock: { gt: 0 } },
        },
        include: { product: productInclude },
        orderBy: { product: { name: 'asc' } },
      });
      const lowRows = rows.map(mapRow).filter((r) => r.lowStock);
      return {
        data: lowRows.slice(skip, skip + limit),
        meta: {
          total: lowRows.length,
          page,
          limit,
          totalPages: Math.ceil(lowRows.length / limit) || 1,
        },
      };
    }

    const [total, rows] = await Promise.all([
      this.prisma.inventory.count({ where }),
      this.prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { product: { name: 'asc' } },
        include: { product: productInclude },
      }),
    ]);

    return {
      data: rows.map(mapRow),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async adjust(dto: AdjustInventoryDto, userId: string, ipAddress?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
        include: { inventory: true },
      });

      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      let inv = product.inventory[0];
      if (!inv) {
        inv = await tx.inventory.create({
          data: { productId: product.id, quantity: 0, reservedQty: 0 },
        });
      }

      const prev = qtyToNumber(inv.quantity);
      const next = dto.newQuantity;
      if (Math.abs(prev - next) < 1e-9) {
        return { adjusted: false as const, quantity: next };
      }

      const nextDec = toQtyDecimal(next);
      const prevDec = toQtyDecimal(prev);

      await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: nextDec },
      });

      const delta = next - prev;
      const unitCost = product.costPrice;
      const totalCost = new Prisma.Decimal(Number(unitCost) * Math.abs(delta));

      await tx.kardexEntry.create({
        data: {
          productId: product.id,
          type: KardexType.ADJUST,
          quantity: toQtyDecimal(delta),
          previousStock: prevDec,
          newStock: nextDec,
          unitCost,
          totalCost,
          notes: dto.reason.trim(),
          userId,
        },
      });

      await tx.inventoryAdjustment.create({
        data: {
          productId: product.id,
          type: 'ADJUST',
          previousQty: prevDec,
          newQty: nextDec,
          reason: dto.reason.trim(),
          userId,
        },
      });

      return {
        adjusted: true as const,
        previousQty: prev,
        newQty: next,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        reservedQty: qtyToNumber(inv.reservedQty),
        unitCost: product.costPrice.toString(),
        reason: dto.reason.trim(),
      };
    });

    if (result.adjusted) {
      await this.audit.record({
        userId,
        action: 'inventory.adjust',
        module: 'inventory',
        entityId: result.productId,
        entityType: 'Product',
        oldData: {
          productId: result.productId,
          sku: result.sku,
          productName: result.productName,
          previousQty: result.previousQty,
          reservedQty: result.reservedQty,
          unitCost: result.unitCost,
        },
        newData: {
          productId: result.productId,
          sku: result.sku,
          productName: result.productName,
          newQty: result.newQty,
          delta: qtyToNumber(result.newQty) - qtyToNumber(result.previousQty),
          reason: result.reason,
        },
        ipAddress: ipAddress ?? null,
      });
      this.realtime.emitInventoryUpdated({
        productId: result.productId,
        quantity: qtyToNumber(result.newQty),
        sku: result.sku,
      });
    }

    void this.notifications.maybeNotifyLowStockAfterChange(dto.productId);

    return result;
  }
}
