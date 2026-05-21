import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KardexType, PaymentMethod, Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { SalesService } from '../sales/sales.service';
import { InvoicesService } from '../invoices/invoices.service';
import { InventoryStockService } from '../inventory/inventory-stock.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { buildKardexCreateData } from '../../common/utils/kardex-movement.util';
import {
  factorForUnit,
  productUnitProfileFromRow,
} from '../../common/utils/product-unit-conversion.util';
import { qtyToNumber, toQtyDecimal } from '../../common/utils/product-quantity.util';
import { SaleLineInputDto, SalePaymentInputDto } from '../sales/dto/create-sale.dto';
import { CreatePosCartDto } from './dto/create-pos-cart.dto';
import { UpdatePosCartDto } from './dto/update-pos-cart.dto';
import { CheckoutPosCartDto } from './dto/checkout-pos-cart.dto';
import { QueryPosCartsDto } from './dto/query-pos-carts.dto';
import { roundCop } from '../../common/utils/cop-money.util';
import { normalizeSaleLines } from '../../common/utils/sale-lines.util';

function computeSaleTotals(items: SaleLineInputDto[]) {
  const seen = new Set<string>();
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  const lines: Array<
    SaleLineInputDto & { lineBase: number; lineTax: number; lineSubtotal: number }
  > = [];

  for (const it of items) {
    if (seen.has(it.productId)) {
      throw new BadRequestException('No repita el mismo producto en las líneas');
    }
    seen.add(it.productId);
    const unitPrice = roundCop(it.unitPrice);
    const unitDisc = roundCop(it.discount ?? 0);
    const base = roundCop(it.quantity * (unitPrice - unitDisc));
    const tax = roundCop(base * (it.taxRate / 100));
    subtotal += base;
    discountTotal += it.quantity * unitDisc;
    taxTotal += tax;
    lines.push({
      ...it,
      unitPrice,
      discount: unitDisc,
      lineBase: base,
      lineTax: tax,
      lineSubtotal: base,
    });
  }

  const total = roundCop(subtotal + taxTotal);
  return {
    lines,
    subtotal: new Prisma.Decimal(roundCop(subtotal).toFixed(2)),
    discountTotal: new Prisma.Decimal(roundCop(discountTotal).toFixed(2)),
    taxTotal: new Prisma.Decimal(roundCop(taxTotal).toFixed(2)),
    total: new Prisma.Decimal(total.toFixed(2)),
  };
}

function paymentNet(p: SalePaymentInputDto): number {
  return roundCop(Number(p.amount) - Number(p.change ?? 0));
}

async function uniqueCartNumber(prisma: PrismaService): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const n = `CART-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const dup = await prisma.sale.findUnique({ where: { number: n } });
    if (!dup) return n;
  }
  throw new ConflictException('No se pudo generar número de carrito único');
}

async function uniqueSaleNumber(prisma: PrismaService): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const n = `V-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const dup = await prisma.sale.findUnique({ where: { number: n } });
    if (!dup) return n;
  }
  throw new ConflictException('No se pudo generar número de venta único');
}

const OPEN_CART_STATUSES: SaleStatus[] = [SaleStatus.PENDING, SaleStatus.SUSPENDED];

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
    private readonly invoicesService: InvoicesService,
    private readonly inventoryStock: InventoryStockService,
    private readonly cashRegister: CashRegisterService,
    private readonly authService: AuthService,
  ) {}

  private mapList(s: {
    id: string;
    number: string;
    total: Prisma.Decimal;
    status: SaleStatus;
    createdAt: Date;
    customer: { id: string; name: string } | null;
    user: { id: string; firstName: string; lastName: string };
    _count?: { items: number };
  }) {
    return {
      id: s.id,
      number: s.number,
      total: s.total.toString(),
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      customer: s.customer,
      user: {
        id: s.user.id,
        name: `${s.user.firstName} ${s.user.lastName}`.trim(),
      },
      lineCount: s._count?.items ?? 0,
    };
  }

  private async assertCustomer(customerId?: string) {
    if (!customerId) return;
    const c = await this.prisma.customer.findFirst({
      where: { id: customerId, isActive: true },
    });
    if (!c) throw new BadRequestException('Cliente no válido o inactivo');
  }

  private async assertDiscountAllowed(userId: string, items: SaleLineInputDto[]) {
    const hasDisc = items.some((it) => Number(it.discount ?? 0) > 0);
    if (!hasDisc) return;
    const perms = await this.authService.getUserPermissions(userId);
    if (!perms.includes('pos.apply_discount')) {
      throw new ForbiddenException('No tiene permiso para aplicar descuentos en el POS');
    }
  }

  async createCart(dto: CreatePosCartDto, userId: string) {
    await this.cashRegister.requireOpenSession(userId);
    await this.assertCustomer(dto.customerId);
    const number = await uniqueCartNumber(this.prisma);
    const zero = new Prisma.Decimal('0.00');
    const sale = await this.prisma.sale.create({
      data: {
        number,
        customerId: dto.customerId ?? null,
        userId,
        subtotal: zero,
        discountTotal: zero,
        taxTotal: zero,
        total: zero,
        status: SaleStatus.PENDING,
      },
    });
    return this.getCart(sale.id);
  }

  async findCarts(query: QueryPosCartsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    if (query.status && !OPEN_CART_STATUSES.includes(query.status)) {
      throw new BadRequestException('status debe ser PENDING o SUSPENDED');
    }

    const where: Prisma.SaleWhereInput = {
      status: query.status ? query.status : { in: OPEN_CART_STATUSES },
    };

    const [total, rows] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return {
      data: rows.map((r) => this.mapList(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getCart(id: string) {
    const s = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, documentNumber: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasureId: true,
                contentPerUnit: true,
                contentUnitId: true,
                unitOfMeasure: {
                  select: {
                    id: true,
                    name: true,
                    symbol: true,
                    allowsDecimals: true,
                    decimalPlaces: true,
                  },
                },
                contentUnit: {
                  select: {
                    id: true,
                    name: true,
                    symbol: true,
                    allowsDecimals: true,
                    decimalPlaces: true,
                  },
                },
              },
            },
            saleUnit: {
              select: { id: true, symbol: true, name: true, decimalPlaces: true },
            },
          },
          orderBy: { id: 'asc' },
        },
        payments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!s) throw new NotFoundException('Carrito no encontrado');
    if (!OPEN_CART_STATUSES.includes(s.status)) {
      throw new BadRequestException('El carrito ya no está abierto');
    }

    return {
      id: s.id,
      number: s.number,
      status: s.status,
      subtotal: s.subtotal.toString(),
      discountTotal: s.discountTotal.toString(),
      taxTotal: s.taxTotal.toString(),
      total: s.total.toString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      paidAt: s.paidAt?.toISOString() ?? null,
      customer: s.customer,
      user: {
        id: s.user.id,
        name: `${s.user.firstName} ${s.user.lastName}`.trim(),
        email: s.user.email,
      },
      items: s.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        quantity: qtyToNumber(it.quantity),
        saleUnitId: it.saleUnitId,
        baseQuantity: qtyToNumber(it.baseQuantity),
        unitPrice: it.unitPrice.toString(),
        discount: it.discount.toString(),
        taxRate: it.taxRate.toString(),
        subtotal: it.subtotal.toString(),
        product: it.product,
        saleUnit: it.saleUnit,
      })),
      payments: s.payments.map((p) => ({
        id: p.id,
        method: p.method,
        amount: p.amount.toString(),
        change: p.change.toString(),
        reference: p.reference,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }

  async updateCart(id: string, dto: UpdatePosCartDto, userId: string) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Carrito no encontrado');
    if (!OPEN_CART_STATUSES.includes(sale.status)) {
      throw new BadRequestException('No se puede editar este carrito');
    }

    if (dto.customerId !== undefined) {
      await this.assertCustomer(dto.customerId ?? undefined);
    }

    await this.assertDiscountAllowed(userId, dto.items);

    const { lines, subtotal, discountTotal, taxTotal, total } = computeSaleTotals(dto.items);

    const existingItems = await this.prisma.saleItem.findMany({
      where: { saleId: id },
      select: { productId: true },
    });
    const productIdsToSync = [
      ...existingItems.map((i) => i.productId),
      ...lines.map((l) => l.productId),
    ];

    await this.prisma.$transaction(async (tx) => {
      await this.inventoryStock.syncReservedQty(tx, productIdsToSync);
      const normalized = await normalizeSaleLines(tx, dto.items);
      const subtotalByProduct = new Map(
        lines.map((l) => [l.productId, l.lineSubtotal] as const),
      );
      await this.inventoryStock.assertLinesWithinAvailable(
        tx,
        normalized.map((l) => ({ productId: l.productId, quantity: l.baseQuantity })),
        id,
      );

      await tx.saleItem.deleteMany({ where: { saleId: id } });
      if (normalized.length > 0) {
        await tx.saleItem.createMany({
          data: normalized.map((l) => ({
            saleId: id,
            productId: l.productId,
            quantity: toQtyDecimal(l.quantity),
            baseQuantity: toQtyDecimal(l.baseQuantity),
            saleUnitId: l.saleUnitId,
            unitPrice: l.unitPrice,
            discount: l.discount,
            taxRate: l.taxRate,
            subtotal: new Prisma.Decimal(
              (subtotalByProduct.get(l.productId) ?? 0).toFixed(2),
            ),
          })),
        });
      }
      await tx.sale.update({
        where: { id },
        data: {
          ...(dto.customerId !== undefined && { customerId: dto.customerId }),
          subtotal,
          discountTotal,
          taxTotal,
          total,
        },
      });

      await this.inventoryStock.syncReservedQty(tx, productIdsToSync);
    });

    return this.getCart(id);
  }

  async suspend(id: string) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Carrito no encontrado');
    if (sale.status !== SaleStatus.PENDING) {
      throw new BadRequestException('Solo se pueden suspender carritos activos (PENDING)');
    }
    await this.prisma.sale.update({
      where: { id },
      data: { status: SaleStatus.SUSPENDED },
    });
    return this.getCart(id);
  }

  async resume(id: string) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Carrito no encontrado');
    if (sale.status !== SaleStatus.SUSPENDED) {
      throw new BadRequestException('Solo se pueden reanudar ventas suspendidas');
    }
    await this.prisma.sale.update({
      where: { id },
      data: { status: SaleStatus.PENDING },
    });
    return this.getCart(id);
  }

  async discard(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: { select: { productId: true } } },
    });
    if (!sale) throw new NotFoundException('Carrito no encontrado');
    if (!OPEN_CART_STATUSES.includes(sale.status)) {
      throw new BadRequestException('Este carrito ya no se puede descartar');
    }
    const productIds = sale.items.map((i) => i.productId);
    await this.prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id },
        data: { status: SaleStatus.CANCELLED },
      });
      await this.inventoryStock.syncReservedQty(tx, productIds);
    });
    return { id, status: SaleStatus.CANCELLED };
  }

  async checkout(id: string, dto: CheckoutPosCartDto, userId: string) {
    const cashSession = await this.cashRegister.requireOpenSession(userId);
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Carrito no encontrado');
    if (!OPEN_CART_STATUSES.includes(sale.status)) {
      throw new BadRequestException('El carrito no está listo para cobrar');
    }
    if (sale.items.length === 0) {
      throw new BadRequestException('Agregue productos antes de cobrar');
    }

    const itemsDto: SaleLineInputDto[] = sale.items.map((it) => ({
      productId: it.productId,
      quantity: qtyToNumber(it.quantity),
      saleUnitId: it.saleUnitId ?? undefined,
      unitPrice: Number(it.unitPrice),
      discount: Number(it.discount),
      taxRate: Number(it.taxRate),
    }));

    await this.assertDiscountAllowed(userId, itemsDto);

    const { lines, subtotal, discountTotal, taxTotal, total } = computeSaleTotals(itemsDto);
    const paid = dto.payments.reduce((sum, p) => sum + paymentNet(p), 0);
    if (Math.abs(paid - Number(total)) > 0.02) {
      throw new BadRequestException(
        `El total pagado (${paid.toFixed(2)}) no coincide con el total (${total.toFixed(2)})`,
      );
    }

    const number = await uniqueSaleNumber(this.prisma);
    const now = new Date();

    const productIds = sale.items.map((it) => it.productId);

    await this.prisma.$transaction(async (tx) => {
      await this.inventoryStock.assertLinesWithinAvailable(
        tx,
        sale.items.map((it) => ({
          productId: it.productId,
          quantity: qtyToNumber(it.baseQuantity),
        })),
        id,
      );

      await tx.payment.deleteMany({ where: { saleId: id } });

      await tx.sale.update({
        where: { id },
        data: {
          number,
          subtotal,
          discountTotal,
          taxTotal,
          total,
          status: SaleStatus.COMPLETED,
          paidAt: now,
        },
      });

      await tx.payment.createMany({
        data: dto.payments.map((p) => ({
          saleId: id,
          method: p.method as PaymentMethod,
          amount: p.amount,
          reference: p.reference?.trim() || null,
          change: p.change ?? 0,
        })),
      });

      for (const line of lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          include: {
            inventory: true,
            unitOfMeasure: true,
            contentUnit: true,
            alternateUnits: {
              include: { unitOfMeasure: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        });
        if (!product?.isActive) {
          throw new BadRequestException(`Producto ${line.productId} no disponible`);
        }
        const inv = product.inventory[0];
        if (!inv) {
          throw new BadRequestException(`Producto ${product.sku} sin inventario`);
        }
        const cartLine = sale.items.find((i) => i.productId === line.productId);
        const lineQty = qtyToNumber(cartLine?.baseQuantity ?? line.quantity);
        const opQty = qtyToNumber(cartLine?.quantity ?? line.quantity);
        const saleUnitId = cartLine?.saleUnitId ?? product.unitOfMeasureId;
        const prev = qtyToNumber(inv.quantity);
        const next = prev - lineQty;
        const nextDec = toQtyDecimal(next);
        const prevDec = toQtyDecimal(prev);
        const unitPrice = new Prisma.Decimal(line.unitPrice);
        const totalCost = new Prisma.Decimal(
          (Number(line.unitPrice) * opQty).toFixed(2),
        );
        const profile = productUnitProfileFromRow(product);

        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            quantity: nextDec,
            reservedQty: toQtyDecimal(
              Math.max(0, qtyToNumber(inv.reservedQty) - lineQty),
            ),
          },
        });

        await tx.kardexEntry.create({
          data: buildKardexCreateData({
            productId: product.id,
            type: KardexType.OUT,
            baseDelta: -lineQty,
            previousStock: prev,
            newStock: next,
            unitCost: unitPrice,
            totalCost,
            referenceType: 'Sale',
            referenceId: id,
            notes: `Venta POS ${number}`,
            userId,
            operationalQuantity: opQty,
            operationalUnitId: saleUnitId,
            conversionFactor: factorForUnit(profile, saleUnitId),
          }),
        });
      }

      await this.inventoryStock.syncReservedQty(tx, productIds);

      await this.cashRegister.linkCompletedSaleToSession(tx, {
        userId,
        sessionId: cashSession.id,
        saleId: id,
        saleNumber: number,
        payments: dto.payments.map((p) => ({
          method: p.method as PaymentMethod,
          amount: p.amount,
          change: p.change ?? 0,
        })),
      });
    });

    await this.invoicesService.autoCreateFromSale(id);
    return this.salesService.findOne(id);
  }
}
