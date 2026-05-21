import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { qtyToNumber, toQtyDecimal } from '../../common/utils/product-quantity.util';

export const OPEN_CART_STATUSES: SaleStatus[] = [SaleStatus.PENDING, SaleStatus.SUSPENDED];

export interface StockLineRequest {
  productId: string;
  quantity: number;
}

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class InventoryStockService {
  constructor(private readonly prisma: PrismaService) {}

  /** Suma de cantidades en carritos PENDING/SUSPENDED por producto (opcionalmente excl. un carrito). */
  async getOpenCartReservedByProduct(
    client: PrismaClientLike = this.prisma,
    excludeSaleId?: string,
  ): Promise<Map<string, number>> {
    const where: Prisma.SaleItemWhereInput = {
      sale: { status: { in: OPEN_CART_STATUSES } },
    };
    if (excludeSaleId) {
      where.saleId = { not: excludeSaleId };
    }
    const groups = await client.saleItem.groupBy({
      by: ['productId'],
      where,
      _sum: { baseQuantity: true },
    });
    const map = new Map<string, number>();
    for (const g of groups) {
      map.set(g.productId, qtyToNumber(g._sum.baseQuantity));
    }
    return map;
  }

  /** Unidades reservadas en carritos POS abiertos (opcionalmente excluyendo un carrito). */
  async reservedInOpenCartsExcept(
    tx: Prisma.TransactionClient,
    productId: string,
    excludeSaleId?: string,
  ): Promise<number> {
    const where: Prisma.SaleItemWhereInput = {
      productId,
      sale: { status: { in: OPEN_CART_STATUSES } },
    };
    if (excludeSaleId) {
      where.saleId = { not: excludeSaleId };
    }
    const agg = await tx.saleItem.aggregate({
      where,
      _sum: { baseQuantity: true },
    });
    return qtyToNumber(agg._sum.baseQuantity);
  }

  async getAvailability(
    tx: Prisma.TransactionClient,
    productId: string,
    excludeSaleId?: string,
  ): Promise<{ quantity: number; reservedByOthers: number; available: number }> {
    const inv = await tx.inventory.findUnique({ where: { productId } });
    const quantity = qtyToNumber(inv?.quantity);
    const reservedByOthers = await this.reservedInOpenCartsExcept(tx, productId, excludeSaleId);
    const available = Math.max(0, quantity - reservedByOthers);
    return { quantity, reservedByOthers, available };
  }

  async assertLinesWithinAvailable(
    tx: Prisma.TransactionClient,
    lines: StockLineRequest[],
    excludeSaleId?: string,
  ): Promise<void> {
    const byProduct = new Map<string, number>();
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a cero');
      }
      byProduct.set(line.productId, (byProduct.get(line.productId) ?? 0) + line.quantity);
    }

    for (const [productId, need] of byProduct) {
      const { available } = await this.getAvailability(tx, productId, excludeSaleId);
      if (need > available) {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { name: true, sku: true },
        });
        const label = product ? `${product.sku} — ${product.name}` : productId;
        throw new BadRequestException(
          `Stock insuficiente para ${label}: disponible ${available}, solicitado ${need}`,
        );
      }
    }
  }

  /** Sincroniza `inventory.reservedQty` con la suma de ítems en carritos PENDING/SUSPENDED. */
  async syncReservedQty(tx: Prisma.TransactionClient, productIds: string[]): Promise<void> {
    const unique = [...new Set(productIds.filter(Boolean))];
    for (const productId of unique) {
      const agg = await tx.saleItem.aggregate({
        where: {
          productId,
          sale: { status: { in: OPEN_CART_STATUSES } },
        },
        _sum: { baseQuantity: true },
      });
      const reserved = toQtyDecimal(qtyToNumber(agg._sum.baseQuantity));
      const existing = await tx.inventory.findUnique({ where: { productId } });
      if (!existing) {
        await tx.inventory.create({
          data: { productId, quantity: 0, reservedQty: reserved },
        });
      } else if (qtyToNumber(existing.reservedQty) !== qtyToNumber(reserved)) {
        await tx.inventory.update({
          where: { productId },
          data: { reservedQty: reserved },
        });
      }
    }
  }
}
