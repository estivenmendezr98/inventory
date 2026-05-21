import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  KardexType,
  PaymentMethod,
  Prisma,
  SaleAdjustmentAction,
  SaleStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { InventoryStockService } from '../inventory/inventory-stock.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  snapshotSaleHeader,
  snapshotSaleItems,
  snapshotSalePayments,
} from '../audit/audit-snapshots.util';
import { CreateSaleDto, SaleLineInputDto, SalePaymentInputDto } from './dto/create-sale.dto';
import {
  CreateSaleAdjustmentDto,
  SaleAdjustmentChangeDto,
  SaleAdjustmentPaymentDeltaDto,
} from './dto/create-sale-adjustment.dto';
import { PreviewSaleAdjustmentDto } from './dto/preview-sale-adjustment.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { roundCop } from '../../common/utils/cop-money.util';
import { qtyToNumber, toQtyDecimal } from '../../common/utils/product-quantity.util';
import { buildKardexCreateData } from '../../common/utils/kardex-movement.util';
import {
  factorForUnit,
  productUnitProfileFromRow,
} from '../../common/utils/product-unit-conversion.util';
import { normalizeSaleLines } from '../../common/utils/sale-lines.util';

type WorkingLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
};

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

function paymentsNetTotal(
  payments: Array<{ method: PaymentMethod; amount: Prisma.Decimal | number; change: Prisma.Decimal | number }>,
  method: PaymentMethod,
): number {
  return roundCop(
    payments
      .filter((p) => p.method === method)
      .reduce(
        (sum, p) =>
          sum +
          paymentNet({
            method: p.method,
            amount: Number(p.amount),
            change: Number(p.change),
          }),
        0,
      ),
  );
}

type SaleForAdjustment = {
  id: string;
  number: string;
  total: Prisma.Decimal;
  status: SaleStatus;
  cashSessionId: string | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    discount: Prisma.Decimal;
    taxRate: Prisma.Decimal;
    product: { id: string; isActive: boolean; salePrice: Prisma.Decimal; taxRate: Prisma.Decimal };
  }>;
  payments: Array<{
    id: string;
    method: PaymentMethod;
    amount: Prisma.Decimal;
    change: Prisma.Decimal;
  }>;
  invoice: { status: InvoiceStatus } | null;
};

function resolvePaymentDeltaForAdjustment(
  payments: SaleForAdjustment['payments'],
  totalDelta: number,
  provided?: SaleAdjustmentPaymentDeltaDto,
): SaleAdjustmentPaymentDeltaDto | null {
  if (Math.abs(totalDelta) <= 0.02) return null;

  const expected = Math.abs(totalDelta);

  if (provided) {
    const payNet = paymentNet(provided as SalePaymentInputDto);
    if (Math.abs(payNet - expected) > 1) {
      throw new BadRequestException(
        `El monto del ajuste (${copFmt(payNet)}) debe coincidir con la diferencia (${copFmt(expected)}).`,
      );
    }
    return provided;
  }

  if (payments.length === 1) {
    return {
      method: payments[0].method,
      amount: expected,
      change: 0,
    };
  }

  const cashTotal = paymentsNetTotal(payments, PaymentMethod.CASH);
  if (cashTotal > 0.009) {
    if (totalDelta < 0 && cashTotal + 0.02 >= expected) {
      return { method: PaymentMethod.CASH, amount: expected, change: 0 };
    }
    if (totalDelta > 0) {
      return { method: PaymentMethod.CASH, amount: expected, change: 0 };
    }
    if (totalDelta < 0) {
      throw new BadRequestException(
        `Devolución de ${copFmt(expected)} supera el efectivo registrado (${copFmt(cashTotal)}). Ajuste el monto o el método.`,
      );
    }
  }

  if (totalDelta < 0) {
    const cardTotal = paymentsNetTotal(payments, PaymentMethod.CARD);
    if (cardTotal + 0.02 >= expected) {
      return { method: PaymentMethod.CARD, amount: expected, change: 0 };
    }
    const transferTotal = paymentsNetTotal(payments, PaymentMethod.TRANSFER);
    if (transferTotal + 0.02 >= expected) {
      return { method: PaymentMethod.TRANSFER, amount: expected, change: 0 };
    }
  }

  throw new BadRequestException(paymentResolutionHint(totalDelta));
}

function paymentResolutionHint(totalDelta: number): string {
  return `El total cambió ${totalDelta > 0 ? '+' : ''}${copFmt(totalDelta)}. Indique método y monto de cobro o devolución.`;
}

function tryResolvePaymentDelta(
  payments: SaleForAdjustment['payments'],
  totalDelta: number,
  provided?: SaleAdjustmentPaymentDeltaDto,
): { payment: SaleAdjustmentPaymentDeltaDto | null; error: string | null } {
  try {
    return { payment: resolvePaymentDeltaForAdjustment(payments, totalDelta, provided), error: null };
  } catch (e) {
    const msg =
      e instanceof BadRequestException
        ? e.message
        : 'Indique método y monto de cobro o devolución.';
    return { payment: null, error: msg };
  }
}

function copFmt(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

async function uniqueSaleNumber(prisma: PrismaService): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const n = `V-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const dup = await prisma.sale.findUnique({ where: { number: n } });
    if (!dup) return n;
  }
  throw new ConflictException('No se pudo generar número de venta único');
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
    private readonly inventoryStock: InventoryStockService,
    private readonly cashRegister: CashRegisterService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private mapList(s: {
    id: string;
    number: string;
    total: Prisma.Decimal;
    status: SaleStatus;
    createdAt: Date;
    paidAt: Date | null;
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
      paidAt: s.paidAt?.toISOString() ?? null,
      customer: s.customer,
      user: {
        id: s.user.id,
        name: `${s.user.firstName} ${s.user.lastName}`.trim(),
      },
      lineCount: s._count?.items ?? 0,
    };
  }

  async findAll(query: QuerySalesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { number: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  async findOne(id: string) {
    const s = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, documentNumber: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true } } },
          orderBy: { id: 'asc' },
        },
        payments: { orderBy: { createdAt: 'asc' } },
        invoice: {
          select: { id: true, prefix: true, number: true, status: true, date: true },
        },
      },
    });
    if (!s) throw new NotFoundException('Venta no encontrada');

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
        quantity: it.quantity,
        unitPrice: it.unitPrice.toString(),
        discount: it.discount.toString(),
        taxRate: it.taxRate.toString(),
        subtotal: it.subtotal.toString(),
        product: it.product,
      })),
      payments: s.payments.map((p) => ({
        id: p.id,
        method: p.method,
        amount: p.amount.toString(),
        change: p.change.toString(),
        reference: p.reference,
        createdAt: p.createdAt.toISOString(),
      })),
      invoice: s.invoice
        ? {
            id: s.invoice.id,
            number: `${s.invoice.prefix}-${s.invoice.number}`,
            status: s.invoice.status,
            date: s.invoice.date.toISOString(),
          }
        : null,
    };
  }

  private async assertCustomer(customerId?: string) {
    if (!customerId) return;
    const c = await this.prisma.customer.findFirst({
      where: { id: customerId, isActive: true },
    });
    if (!c) throw new BadRequestException('Cliente no válido o inactivo');
  }

  async create(dto: CreateSaleDto, userId: string, ipAddress?: string) {
    const cashSession = await this.cashRegister.requireOpenSession(userId);
    await this.assertCustomer(dto.customerId);

    const { lines, subtotal, discountTotal, taxTotal, total } = computeSaleTotals(dto.items);
    const paid = dto.payments.reduce((sum, p) => sum + paymentNet(p), 0);
    if (Math.abs(paid - Number(total)) > 0.02) {
      throw new BadRequestException(
        `El total pagado (${paid.toFixed(2)}) no coincide con el total de la venta (${total.toFixed(2)})`,
      );
    }

    const number = await uniqueSaleNumber(this.prisma);
    const now = new Date();

    const sale = await this.prisma.$transaction(async (tx) => {
      const normalized = await normalizeSaleLines(tx, dto.items);
      const subtotalByProduct = new Map(
        lines.map((l) => [l.productId, l.lineSubtotal] as const),
      );
      await this.inventoryStock.assertLinesWithinAvailable(
        tx,
        normalized.map((l) => ({ productId: l.productId, quantity: l.baseQuantity })),
      );

      const saleRow = await tx.sale.create({
        data: {
          number,
          customerId: dto.customerId ?? null,
          userId,
          subtotal,
          discountTotal,
          taxTotal,
          total,
          status: SaleStatus.COMPLETED,
          paidAt: now,
          items: {
            create: normalized.map((l) => ({
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
          },
          payments: {
            create: dto.payments.map((p) => ({
              method: p.method as PaymentMethod,
              amount: p.amount,
              reference: p.reference?.trim() || null,
              change: p.change ?? 0,
            })),
          },
        },
      });

      for (const line of normalized) {
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
        const lineQty = line.baseQuantity;
        const prev = qtyToNumber(inv.quantity);
        const next = prev - lineQty;
        const nextDec = toQtyDecimal(next);
        const prevDec = toQtyDecimal(prev);
        const unitPrice = new Prisma.Decimal(line.unitPrice);
        const totalCost = new Prisma.Decimal(
          (Number(line.unitPrice) * line.quantity).toFixed(2),
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
            referenceId: saleRow.id,
            notes: `Venta ${number}`,
            userId,
            operationalQuantity: line.quantity,
            operationalUnitId: line.saleUnitId,
            conversionFactor: factorForUnit(profile, line.saleUnitId),
          }),
        });
      }

      await this.inventoryStock.syncReservedQty(
        tx,
        lines.map((l) => l.productId),
      );

      await this.cashRegister.linkCompletedSaleToSession(tx, {
        userId,
        sessionId: cashSession.id,
        saleId: saleRow.id,
        saleNumber: number,
        payments: dto.payments.map((p) => ({
          method: p.method as PaymentMethod,
          amount: p.amount,
          change: p.change ?? 0,
        })),
      });

      return saleRow;
    });

    await this.invoicesService.autoCreateFromSale(sale.id);

    const full = await this.prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        items: { include: { product: { select: { sku: true, name: true } } } },
        payments: true,
        customer: {
          select: { id: true, name: true, documentType: true, documentNumber: true },
        },
        invoice: { select: { id: true, prefix: true, number: true, status: true } },
      },
    });
    if (full) {
      await this.audit.record({
        userId,
        action: 'sale.create',
        module: 'sales',
        entityId: full.id,
        entityType: 'Sale',
        newData: {
          ...snapshotSaleHeader({ ...full, cashSessionId: cashSession.id }),
          items: snapshotSaleItems(full.items),
          payments: snapshotSalePayments(full.payments),
        },
        ipAddress: ipAddress ?? null,
      });
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    for (const pid of productIds) {
      void this.notifications.maybeNotifyLowStockAfterChange(pid);
    }
    void this.notifications.notifySaleCompleted(
      sale.id,
      number,
      Number(total).toFixed(2),
      userId,
    );

    return this.findOne(sale.id);
  }

  private async reverseSaleStock(
    tx: Prisma.TransactionClient,
    saleId: string,
    userId: string,
    note: string,
  ) {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');

    for (const item of sale.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
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
      if (!product?.inventory[0]) {
        throw new BadRequestException(`Inventario no encontrado para producto ${item.productId}`);
      }
      const inv = product.inventory[0];
      const baseQty = qtyToNumber(item.baseQuantity);
      const opQty = qtyToNumber(item.quantity);
      const prev = qtyToNumber(inv.quantity);
      const next = prev + baseQty;
      const nextDec = toQtyDecimal(next);
      const prevDec = toQtyDecimal(prev);
      const unitPrice = item.unitPrice;
      const totalCost = new Prisma.Decimal(
        (Number(item.unitPrice) * opQty).toFixed(2),
      );
      const profile = productUnitProfileFromRow(product);
      const unitId = item.saleUnitId ?? product.unitOfMeasureId;

      await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: nextDec },
      });

      await tx.kardexEntry.create({
        data: buildKardexCreateData({
          productId: product.id,
          type: KardexType.IN,
          baseDelta: baseQty,
          previousStock: prev,
          newStock: next,
          unitCost: item.unitPrice,
          totalCost,
          referenceType: 'Sale',
          referenceId: sale.id,
          notes: note,
          userId,
          operationalQuantity: opQty,
          operationalUnitId: unitId,
          conversionFactor: factorForUnit(profile, unitId),
        }),
      });
    }
  }

  async cancel(id: string, userId: string, ipAddress?: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { sku: true, name: true } } } },
        payments: true,
        customer: {
          select: { id: true, name: true, documentType: true, documentNumber: true },
        },
        invoice: { select: { id: true, prefix: true, number: true, status: true } },
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.status === SaleStatus.CANCELLED || sale.status === SaleStatus.REFUNDED) {
      throw new BadRequestException('La venta ya está anulada o reembolsada');
    }
    if (sale.status === SaleStatus.SUSPENDED) {
      throw new BadRequestException('Use el flujo POS para ventas suspendidas');
    }

    if (sale.status === SaleStatus.COMPLETED) {
      await this.prisma.$transaction(async (tx) => {
        await this.reverseSaleStock(tx, id, userId, `Anulación venta ${sale.number}`);
        await tx.sale.update({
          where: { id },
          data: { status: SaleStatus.CANCELLED },
        });
      });
    } else if (sale.status === SaleStatus.PENDING) {
      await this.prisma.sale.update({
        where: { id },
        data: { status: SaleStatus.CANCELLED },
      });
    }

    await this.audit.record({
      userId,
      action: 'sale.cancel',
      module: 'sales',
      entityId: id,
      entityType: 'Sale',
      oldData: {
        ...snapshotSaleHeader(sale),
        items: snapshotSaleItems(sale.items),
        payments: snapshotSalePayments(sale.payments),
      },
      newData: { status: SaleStatus.CANCELLED },
      ipAddress: ipAddress ?? null,
    });

    return this.findOne(id);
  }

  async refund(id: string, userId: string, ipAddress?: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { sku: true, name: true } } } },
        payments: true,
        customer: {
          select: { id: true, name: true, documentType: true, documentNumber: true },
        },
        invoice: { select: { id: true, prefix: true, number: true, status: true } },
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.status !== SaleStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden reembolsar ventas completadas');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.reverseSaleStock(tx, id, userId, `Reembolso venta ${sale.number}`);
      await tx.sale.update({
        where: { id },
        data: { status: SaleStatus.REFUNDED },
      });
    });

    await this.audit.record({
      userId,
      action: 'sale.refund',
      module: 'sales',
      entityId: id,
      entityType: 'Sale',
      oldData: {
        ...snapshotSaleHeader(sale),
        items: snapshotSaleItems(sale.items),
        payments: snapshotSalePayments(sale.payments),
      },
      newData: { status: SaleStatus.REFUNDED },
      ipAddress: ipAddress ?? null,
    });

    return this.findOne(id);
  }

  private async loadSaleForAdjustment(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: { include: { product: true }, orderBy: { id: 'asc' } },
        payments: true,
        invoice: { select: { id: true, status: true, prefix: true, number: true } },
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.status !== SaleStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden ajustar ventas completadas');
    }
    return sale;
  }

  private invoiceAdjustmentMessages(sale: {
    invoice: { status: InvoiceStatus } | null;
  }) {
    const st = sale.invoice?.status;
    if (st === InvoiceStatus.ACTIVE || st === InvoiceStatus.ACTIVE_ADJUSTED) {
      return {
        invoiceWarning:
          st === InvoiceStatus.ACTIVE_ADJUSTED
            ? 'La factura está activa (ajustada). Anúlela nuevamente en facturación antes de otro ajuste; después volverá como Activa (ajustada) con los totales actualizados.'
            : 'La venta tiene factura activa. Anúlela en facturación antes de aplicar el ajuste; después quedará como Activa (ajustada) con los totales actualizados.',
        invoiceHint: null as string | null,
      };
    }
    if (st === InvoiceStatus.CANCELLED) {
      return {
        invoiceWarning: null as string | null,
        invoiceHint:
          'Factura anulada. Al aplicar el ajuste se reactivará como Activa (ajustada) con los totales corregidos.',
      };
    }
    return { invoiceWarning: null as string | null, invoiceHint: null as string | null };
  }

  private previewBlocked(
    sale: Awaited<ReturnType<typeof this.loadSaleForAdjustment>>,
    blockingError: string,
  ) {
    const oldTotal = Number(sale.total);
    const { invoiceWarning, invoiceHint } = this.invoiceAdjustmentMessages(sale);
    return {
      valid: false as const,
      blockingError,
      totalBefore: oldTotal.toString(),
      totalAfter: oldTotal.toString(),
      totalDelta: 0,
      requiresPayment: false,
      suggestedPayment: null,
      paymentError: null,
      cashDrawerDelta: 0,
      lineCount: 0,
      invoiceWarning,
      invoiceHint,
    };
  }

  private async buildWorkingLinesFromChanges(
    sale: Awaited<ReturnType<typeof this.loadSaleForAdjustment>>,
    changes: SaleAdjustmentChangeDto[],
    options?: { allowEmpty?: boolean },
  ): Promise<WorkingLine[]> {
    const itemById = new Map(sale.items.map((it) => [it.id, it]));
    const working: WorkingLine[] = sale.items.map((it) => ({
      productId: it.productId,
      quantity: qtyToNumber(it.quantity),
      unitPrice: Number(it.unitPrice),
      discount: Number(it.discount),
      taxRate: Number(it.taxRate),
    }));

    for (const ch of changes) {
      if (ch.action === 'REMOVE') {
        let target: (typeof sale.items)[0] | undefined;
        if (ch.saleItemId) {
          target = itemById.get(ch.saleItemId);
        }
        if (!target && ch.productId) {
          target = sale.items.find((it) => it.productId === ch.productId);
        }
        if (!target && !ch.saleItemId && !ch.productId) {
          throw new BadRequestException('En REMOVE indique saleItemId o productId');
        }
        if (!target) {
          throw new BadRequestException(
            'Línea no encontrada (la venta pudo haber cambiado; recargue e intente de nuevo)',
          );
        }

        const wIdx = working.findIndex((l) => l.productId === target!.productId);
        if (wIdx < 0) throw new BadRequestException('Producto ya no está en la venta');
        const line = working[wIdx];
        if (ch.quantity > line.quantity) {
          throw new BadRequestException(
            `Cantidad a quitar (${ch.quantity}) mayor que la de la línea (${line.quantity})`,
          );
        }
        if (ch.quantity === line.quantity) {
          working.splice(wIdx, 1);
        } else {
          working[wIdx] = { ...line, quantity: line.quantity - ch.quantity };
        }
        continue;
      }

      if (ch.action === 'ADD') {
        if (!ch.productId) throw new BadRequestException('En ADD indique productId');
        const product = await this.prisma.product.findUnique({
          where: { id: ch.productId },
        });
        if (!product?.isActive) {
          throw new BadRequestException('Producto no disponible para agregar');
        }
        const unitPrice = ch.unitPrice ?? Number(product.salePrice);
        const discount = ch.discount ?? 0;
        const taxRate = Number(product.taxRate);
        const existing = working.find((l) => l.productId === ch.productId);
        if (existing) {
          existing.quantity += ch.quantity;
          existing.unitPrice = unitPrice;
          existing.discount = discount;
          existing.taxRate = taxRate;
        } else {
          working.push({
            productId: ch.productId,
            quantity: ch.quantity,
            unitPrice,
            discount,
            taxRate,
          });
        }
      }
    }

    if (working.length === 0 && !options?.allowEmpty) {
      throw new BadRequestException('La venta debe tener al menos una línea; use cancelar si aplica');
    }
    return working;
  }

  async previewAdjustment(saleId: string, dto: PreviewSaleAdjustmentDto) {
    const sale = await this.loadSaleForAdjustment(saleId);
    const oldTotal = Number(sale.total);

    let working: WorkingLine[];
    try {
      working = await this.buildWorkingLinesFromChanges(sale, dto.changes, { allowEmpty: true });
    } catch (e) {
      const msg =
        e instanceof BadRequestException
          ? e.message
          : 'No se pudo aplicar los cambios a la venta';
      return this.previewBlocked(sale, msg);
    }

    if (working.length === 0) {
      return this.previewBlocked(
        sale,
        'Quedaría sin productos. Agregue el reemplazo en «Agregar producto» (mismo ajuste) o quite solo parte de la cantidad.',
      );
    }

    try {
      const lineInputs: SaleLineInputDto[] = working.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discount: l.discount,
        taxRate: l.taxRate,
      }));
      const { total } = computeSaleTotals(lineInputs);
      const newTotal = Number(total);
      const totalDelta = roundCop(newTotal - oldTotal);
      const { payment: resolvedPayment, error: paymentError } = tryResolvePaymentDelta(
        sale.payments,
        totalDelta,
        dto.paymentDelta,
      );
      let cashDrawerDelta = 0;
      if (resolvedPayment?.method === PaymentMethod.CASH && Math.abs(totalDelta) > 0.02) {
        const net = paymentNet(resolvedPayment as SalePaymentInputDto);
        cashDrawerDelta = totalDelta > 0 ? net : -net;
      }
      const { invoiceWarning, invoiceHint } = this.invoiceAdjustmentMessages(sale);

      return {
        valid: true as const,
        blockingError: null,
        totalBefore: oldTotal.toString(),
        totalAfter: newTotal.toString(),
        totalDelta,
        requiresPayment: Math.abs(totalDelta) > 0.02,
        suggestedPayment: resolvedPayment,
        paymentError,
        cashDrawerDelta,
        lineCount: working.length,
        invoiceWarning,
        invoiceHint,
      };
    } catch (e) {
      const msg =
        e instanceof BadRequestException
          ? e.message
          : 'No se pudo calcular totales del ajuste';
      return this.previewBlocked(sale, msg);
    }
  }

  async adjust(
    saleId: string,
    dto: CreateSaleAdjustmentDto,
    userId: string,
    ipAddress?: string,
  ) {
    const sale = await this.loadSaleForAdjustment(saleId);
    if (
      sale.invoice?.status === InvoiceStatus.ACTIVE ||
      sale.invoice?.status === InvoiceStatus.ACTIVE_ADJUSTED
    ) {
      throw new BadRequestException(
        sale.invoice.status === InvoiceStatus.ACTIVE_ADJUSTED
          ? 'Debe anular la factura activa (ajustada) en facturación antes de otro ajuste. Después volverá como Activa (ajustada).'
          : 'Debe anular la factura activa en facturación antes de aplicar el ajuste. Después del ajuste quedará como Activa (ajustada).',
      );
    }

    const itemById = new Map(sale.items.map((it) => [it.id, it]));
    const working = await this.buildWorkingLinesFromChanges(sale, dto.changes);

    const lineInputs: SaleLineInputDto[] = working.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      taxRate: l.taxRate,
    }));

    const { lines, subtotal, discountTotal, taxTotal, total } = computeSaleTotals(lineInputs);
    const oldTotal = Number(sale.total);
    const newTotal = Number(total);
    const totalDelta = roundCop(newTotal - oldTotal);

    const resolvedPayment = resolvePaymentDeltaForAdjustment(
      sale.payments,
      totalDelta,
      dto.paymentDelta,
    );

    const oldItems = sale.items.map((it) => ({
      productId: it.productId,
      quantity: qtyToNumber(it.quantity),
    }));
    const newItems = lines.map((l) => ({ productId: l.productId, quantity: l.quantity }));

    const stockOut: Array<{ productId: string; quantity: number }> = [];
    const stockIn: Array<{ productId: string; quantity: number }> = [];

    for (const n of newItems) {
      const o = oldItems.find((x) => x.productId === n.productId);
      const diff = n.quantity - (o?.quantity ?? 0);
      if (diff > 0) stockOut.push({ productId: n.productId, quantity: diff });
    }
    for (const o of oldItems) {
      const n = newItems.find((x) => x.productId === o.productId);
      const diff = o.quantity - (n?.quantity ?? 0);
      if (diff > 0) stockIn.push({ productId: o.productId, quantity: diff });
    }

    let cashDelta = 0;
    if (resolvedPayment?.method === PaymentMethod.CASH && Math.abs(totalDelta) > 0.02) {
      const net = paymentNet(resolvedPayment as SalePaymentInputDto);
      cashDelta = totalDelta > 0 ? net : -net;
    }

    const adjustmentLines = dto.changes.map((ch) => ({
      action: ch.action as SaleAdjustmentAction,
      productId: ch.productId ?? itemById.get(ch.saleItemId ?? '')?.productId ?? '',
      saleItemId: ch.saleItemId ?? null,
      quantity: ch.quantity,
      unitPrice: ch.unitPrice != null ? new Prisma.Decimal(ch.unitPrice.toFixed(2)) : null,
    }));

    const { adjustment: result, reactivatedInvoice } = await this.prisma.$transaction(
      async (tx) => {
      const normalized = await normalizeSaleLines(tx, lineInputs);
      const stockOutBase: Array<{ productId: string; quantity: number }> = [];
      const stockInBase: Array<{ productId: string; quantity: number }> = [];
      const oldBase = new Map(
        sale.items.map((it) => [it.productId, qtyToNumber(it.baseQuantity)]),
      );
      for (const n of normalized) {
        const prev = oldBase.get(n.productId) ?? 0;
        const diff = n.baseQuantity - prev;
        if (diff > 0) stockOutBase.push({ productId: n.productId, quantity: diff });
      }
      for (const [productId, prev] of oldBase) {
        const n = normalized.find((x) => x.productId === productId);
        const diff = prev - (n?.baseQuantity ?? 0);
        if (diff > 0) stockInBase.push({ productId, quantity: diff });
      }

      if (stockOutBase.length > 0) {
        await this.inventoryStock.assertLinesWithinAvailable(tx, stockOutBase);
      }

      await tx.saleItem.deleteMany({ where: { saleId } });
      await tx.sale.update({
        where: { id: saleId },
        data: {
          subtotal,
          discountTotal,
          taxTotal,
          total,
          items: {
            create: normalized.map((l) => ({
              productId: l.productId,
              quantity: toQtyDecimal(l.quantity),
              baseQuantity: toQtyDecimal(l.baseQuantity),
              saleUnitId: l.saleUnitId,
              unitPrice: l.unitPrice,
              discount: l.discount,
              taxRate: l.taxRate,
              subtotal: new Prisma.Decimal(
                (lines.find((x) => x.productId === l.productId)?.lineSubtotal ?? 0).toFixed(
                  2,
                ),
              ),
            })),
          },
        },
      });

      for (const o of stockOutBase) {
        await this.applyStockDelta(tx, saleId, sale.number, userId, o.productId, -o.quantity);
      }
      for (const i of stockInBase) {
        await this.applyStockDelta(tx, saleId, sale.number, userId, i.productId, i.quantity);
      }

      if (resolvedPayment && Math.abs(totalDelta) > 0.02) {
        const pd = resolvedPayment;
        if (totalDelta > 0) {
          await tx.payment.create({
            data: {
              saleId,
              method: pd.method,
              amount: pd.amount,
              change: pd.change ?? 0,
              reference: `Ajuste: ${dto.reason.slice(0, 80)}`,
            },
          });
        } else {
          const refundNet = paymentNet(pd as SalePaymentInputDto);
          await this.applyRefundAcrossPayments(tx, sale.payments, pd.method, refundNet);
        }
      }

      const adjustment = await tx.saleAdjustment.create({
        data: {
          saleId,
          cashSessionId: sale.cashSessionId,
          reason: dto.reason.trim(),
          totalBefore: sale.total,
          totalAfter: total,
          cashDelta: new Prisma.Decimal(cashDelta.toFixed(2)),
          createdById: userId,
          lines: {
            create: adjustmentLines
              .filter((l) => l.productId)
              .map((l) => ({
                action: l.action,
                productId: l.productId,
                saleItemId: l.saleItemId,
                quantity: toQtyDecimal(l.quantity ?? 0),
                unitPrice: l.unitPrice,
              })),
          },
        },
        include: { lines: true },
      });

      if (sale.cashSessionId && Math.abs(cashDelta) > 0.009) {
        await this.cashRegister.applySaleCashAdjustment(tx, {
          sessionId: sale.cashSessionId,
          userId,
          saleNumber: sale.number,
          cashNetDelta: cashDelta,
        });
      }

      const reactivated = await this.invoicesService.reactivateAfterSaleAdjustment(tx, {
        saleId,
        subtotal,
        taxTotal,
        total,
      });

      const newItemsDetail = lines.map((l) => {
        const prod = sale.items.find((it) => it.productId === l.productId)?.product;
        return {
          productId: l.productId,
          sku: prod?.sku ?? null,
          productName: prod?.name ?? null,
          quantity: l.quantity,
          unitPrice: l.unitPrice.toFixed(2),
          discount: l.discount,
          taxRate: l.taxRate,
        };
      });

      await this.audit.record({
        userId,
        action: 'sale.adjust',
        module: 'sales',
        entityId: saleId,
        entityType: 'Sale',
        oldData: {
          ...snapshotSaleHeader(sale),
          items: snapshotSaleItems(sale.items),
          payments: snapshotSalePayments(sale.payments),
        },
        newData: {
          adjustmentId: adjustment.id,
          reason: dto.reason.trim(),
          totalDelta: totalDelta,
          cashDelta,
          subtotal: subtotal.toString(),
          discountTotal: discountTotal.toString(),
          taxTotal: taxTotal.toString(),
          total: total.toString(),
          changes: dto.changes,
          itemsAfter: newItemsDetail,
          paymentDelta: resolvedPayment ?? null,
          stockIn,
          stockOut,
          reactivatedInvoice: reactivated ?? null,
        } as unknown as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? null,
      });

      return { adjustment, reactivatedInvoice: reactivated };
    },
    );

    if (reactivatedInvoice) {
      try {
        await this.invoicesService.regenerateArtifacts(reactivatedInvoice.invoiceId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Factura ${reactivatedInvoice.invoiceId} reactivada pero no se regeneró PDF/XML: ${msg}`,
        );
      }
    }

    const updated = await this.findOne(saleId);
    return {
      ...updated,
      adjustment: {
        id: result.id,
        totalBefore: result.totalBefore.toString(),
        totalAfter: result.totalAfter.toString(),
        cashDelta: result.cashDelta.toString(),
        createdAt: result.createdAt.toISOString(),
      },
      invoiceSync: reactivatedInvoice
        ? {
            id: reactivatedInvoice.invoiceId,
            status: InvoiceStatus.ACTIVE_ADJUSTED,
            fullNumber: `${reactivatedInvoice.prefix}-${reactivatedInvoice.number}`,
          }
        : null,
    };
  }

  private async applyRefundAcrossPayments(
    tx: Prisma.TransactionClient,
    payments: Array<{
      id: string;
      method: PaymentMethod;
      amount: Prisma.Decimal;
      change: Prisma.Decimal;
    }>,
    method: PaymentMethod,
    refundNet: number,
  ): Promise<void> {
    const rows = payments.filter((p) => p.method === method);
    if (rows.length === 0) {
      throw new BadRequestException(`No hay pagos ${method} para devolver`);
    }
    const totalNet = paymentsNetTotal(rows, method);
    if (totalNet + 0.02 < refundNet) {
      throw new BadRequestException(
        `El monto a devolver (${copFmt(refundNet)}) supera lo registrado en ${method} (${copFmt(totalNet)}).`,
      );
    }

    let remaining = refundNet;
    for (const pay of rows) {
      if (remaining <= 0.009) break;
      const currentNet = paymentNet({
        method: pay.method,
        amount: Number(pay.amount),
        change: Number(pay.change),
      });
      const reduce = Math.min(remaining, currentNet);
      const newNet = roundCop(currentNet - reduce);
      const newAmount = roundCop(newNet + Number(pay.change));
      await tx.payment.update({
        where: { id: pay.id },
        data: { amount: new Prisma.Decimal(newAmount.toFixed(2)) },
      });
      remaining = roundCop(remaining - reduce);
    }
  }

  private async applyStockDelta(
    tx: Prisma.TransactionClient,
    saleId: string,
    saleNumber: string,
    userId: string,
    productId: string,
    qtyDelta: number,
  ) {
    if (qtyDelta === 0) return;
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });
    if (!product?.inventory[0]) {
      throw new BadRequestException(`Sin inventario para producto ${productId}`);
    }
    const inv = product.inventory[0];
    const prev = qtyToNumber(inv.quantity);
    const next = prev + qtyDelta;
    if (next < -1e-9) {
      throw new BadRequestException(`Stock insuficiente para ${product.sku}`);
    }

    const absQty = Math.abs(qtyDelta);
    const nextDec = toQtyDecimal(next);
    const prevDec = toQtyDecimal(prev);
    const unitPrice = product.salePrice;
    const totalCost = new Prisma.Decimal(
      (Number(unitPrice) * absQty).toFixed(2),
    );

    await tx.inventory.update({
      where: { id: inv.id },
      data: { quantity: nextDec },
    });

    await tx.kardexEntry.create({
      data: {
        productId: product.id,
        type: qtyDelta < 0 ? KardexType.OUT : KardexType.IN,
        quantity: toQtyDecimal(qtyDelta < 0 ? -absQty : absQty),
        previousStock: prevDec,
        newStock: nextDec,
        unitCost: unitPrice,
        totalCost,
        referenceType: 'Sale',
        referenceId: saleId,
        notes: `Ajuste venta ${saleNumber}`,
        userId,
      },
    });

    await this.inventoryStock.syncReservedQty(tx, [productId]);
  }
}
