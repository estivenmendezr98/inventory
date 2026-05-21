import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashMovementType,
  CashSessionStatus,
  PaymentMethod,
  Prisma,
  SaleStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { AdminUpdateSessionDto } from './dto/admin-update-session.dto';
import { AdminUpdateMovementDto } from './dto/admin-update-movement.dto';
import { AuditService } from '../audit/audit.service';
import { qtyToNumber } from '../../common/utils/product-quantity.util';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type SalePaymentForCash = {
  method: PaymentMethod;
  amount: Prisma.Decimal | number;
  change?: Prisma.Decimal | number | null;
};

function expectedBalance(
  opening: number,
  movements: Array<{ type: CashMovementType; amount: Prisma.Decimal }>,
): number {
  let b = opening;
  for (const m of movements) {
    const a = Number(m.amount);
    if (m.type === CashMovementType.INCOME || m.type === CashMovementType.SALE) {
      b += a;
    } else if (m.type === CashMovementType.EXPENSE) {
      b -= a;
    }
  }
  return round2(b);
}

@Injectable()
export class CashRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly audit: AuditService,
  ) {}

  private async canViewSession(sessionUserId: string, viewerId: string): Promise<boolean> {
    if (sessionUserId === viewerId) return true;
    const perms = await this.authService.getUserPermissions(viewerId);
    return perms.includes('cash_register.view_all');
  }

  private async assertCanManage(userId: string): Promise<void> {
    const perms = await this.authService.getUserPermissions(userId);
    if (!perms.includes('cash_register.manage')) {
      throw new ForbiddenException('Solo super administrador puede ajustar sesiones de caja');
    }
  }

  async listRegisters() {
    const rows = await this.prisma.cashRegister.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isActive: true },
    });
    return { data: rows };
  }

  private mapSessionSummary(s: {
    id: string;
    cashRegisterId: string;
    userId: string;
    openingAmount: Prisma.Decimal;
    closingAmount: Prisma.Decimal | null;
    expectedAmount: Prisma.Decimal | null;
    difference: Prisma.Decimal | null;
    openedAt: Date;
    closedAt: Date | null;
    status: CashSessionStatus;
    cashRegister: { name: string };
    user: { id: string; firstName: string; lastName: string };
    _count?: { movements: number };
  }) {
    return {
      id: s.id,
      cashRegisterId: s.cashRegisterId,
      cashRegisterName: s.cashRegister.name,
      userId: s.userId,
      userName: `${s.user.firstName} ${s.user.lastName}`.trim(),
      openingAmount: s.openingAmount.toString(),
      closingAmount: s.closingAmount?.toString() ?? null,
      expectedAmount: s.expectedAmount?.toString() ?? null,
      difference: s.difference?.toString() ?? null,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt?.toISOString() ?? null,
      status: s.status,
      movementCount: s._count?.movements ?? 0,
    };
  }

  async requireOpenSession(userId: string) {
    const s = await this.prisma.cashSession.findFirst({
      where: { userId, status: CashSessionStatus.OPEN },
      include: { cashRegister: { select: { id: true, name: true } } },
    });
    if (!s) {
      throw new BadRequestException(
        'Debe abrir una sesión de caja antes de vender. Vaya a Caja y abra un turno.',
      );
    }
    return s;
  }

  /** Vincula la venta a la sesión y registra movimiento SALE por el neto en efectivo. */
  async linkCompletedSaleToSession(
    tx: Prisma.TransactionClient,
    params: {
      userId: string;
      sessionId: string;
      saleId: string;
      saleNumber: string;
      payments: SalePaymentForCash[];
    },
  ): Promise<void> {
    await tx.sale.update({
      where: { id: params.saleId },
      data: { cashSessionId: params.sessionId },
    });

    const cashNet = params.payments
      .filter((p) => p.method === PaymentMethod.CASH)
      .reduce((sum, p) => sum + round2(Number(p.amount) - Number(p.change ?? 0)), 0);

    if (cashNet <= 0.009) return;

    await tx.cashMovement.create({
      data: {
        sessionId: params.sessionId,
        userId: params.userId,
        type: CashMovementType.SALE,
        amount: new Prisma.Decimal(cashNet.toFixed(2)),
        description: `Venta ${params.saleNumber}`,
      },
    });
  }

  /** Registra delta de efectivo por ajuste de venta y recalcula esperado/diferencia en sesión cerrada. */
  async applySaleCashAdjustment(
    tx: Prisma.TransactionClient,
    params: {
      sessionId: string;
      userId: string;
      saleNumber: string;
      cashNetDelta: number;
    },
  ): Promise<void> {
    const delta = round2(params.cashNetDelta);
    if (Math.abs(delta) < 0.009) return;

    const session = await tx.cashSession.findUnique({ where: { id: params.sessionId } });
    if (!session) throw new NotFoundException('Sesión de caja no encontrada');

    const desc = `Ajuste venta ${params.saleNumber}`;
    if (delta > 0) {
      await tx.cashMovement.create({
        data: {
          sessionId: params.sessionId,
          userId: params.userId,
          type: CashMovementType.INCOME,
          amount: new Prisma.Decimal(delta.toFixed(2)),
          description: desc,
        },
      });
    } else {
      await tx.cashMovement.create({
        data: {
          sessionId: params.sessionId,
          userId: params.userId,
          type: CashMovementType.EXPENSE,
          amount: new Prisma.Decimal(Math.abs(delta).toFixed(2)),
          description: `${desc} (devolución)`,
        },
      });
    }

    const movements = await tx.cashMovement.findMany({ where: { sessionId: params.sessionId } });
    const expected = expectedBalance(Number(session.openingAmount), movements);
    const update: Prisma.CashSessionUpdateInput = {
      expectedAmount: new Prisma.Decimal(expected.toFixed(2)),
    };
    if (session.status === CashSessionStatus.CLOSED && session.closingAmount != null) {
      update.difference = new Prisma.Decimal(
        (Number(session.closingAmount) - expected).toFixed(2),
      );
    }
    await tx.cashSession.update({ where: { id: params.sessionId }, data: update });
  }

  async getCurrentSession(userId: string) {
    const s = await this.prisma.cashSession.findFirst({
      where: { userId, status: CashSessionStatus.OPEN },
      orderBy: { openedAt: 'desc' },
      include: {
        cashRegister: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { movements: true } },
      },
    });
    if (!s) return null;

    const salesSummary = await this.prisma.sale.aggregate({
      where: { cashSessionId: s.id, status: SaleStatus.COMPLETED },
      _count: true,
      _sum: { total: true },
    });

    return {
      ...this.mapSessionDetail(s),
      salesCount: salesSummary._count,
      salesTotal: salesSummary._sum.total?.toString() ?? '0',
    };
  }

  private mapSessionDetail(s: {
    id: string;
    cashRegisterId: string;
    userId: string;
    openingAmount: Prisma.Decimal;
    closingAmount: Prisma.Decimal | null;
    expectedAmount: Prisma.Decimal | null;
    difference: Prisma.Decimal | null;
    openedAt: Date;
    closedAt: Date | null;
    status: CashSessionStatus;
    cashRegister: { id: string; name: string };
    user: { id: string; firstName: string; lastName: string };
    movements: Array<{
      id: string;
      type: CashMovementType;
      amount: Prisma.Decimal;
      description: string | null;
      createdAt: Date;
      user: { id: string; firstName: string; lastName: string };
    }>;
    _count?: { movements: number };
  }) {
    return {
      ...this.mapSessionSummary({
        ...s,
        cashRegister: { name: s.cashRegister.name },
        user: s.user,
        _count: s._count,
      }),
      movements: s.movements.map((m) => ({
        id: m.id,
        type: m.type,
        amount: m.amount.toString(),
        description: m.description,
        createdAt: m.createdAt.toISOString(),
        userName: `${m.user.firstName} ${m.user.lastName}`.trim(),
      })),
    };
  }

  async openSession(dto: OpenSessionDto, userId: string) {
    const reg = await this.prisma.cashRegister.findFirst({
      where: { id: dto.cashRegisterId, isActive: true },
    });
    if (!reg) throw new BadRequestException('Caja no válida o inactiva');

    const existing = await this.prisma.cashSession.findFirst({
      where: { userId, status: CashSessionStatus.OPEN },
    });
    if (existing) {
      throw new BadRequestException('Ya tiene una sesión de caja abierta');
    }

    const session = await this.prisma.cashSession.create({
      data: {
        cashRegisterId: dto.cashRegisterId,
        userId,
        openingAmount: dto.openingAmount,
        status: CashSessionStatus.OPEN,
      },
      include: { cashRegister: { select: { name: true } } },
    });

    await this.audit.record({
      userId,
      action: 'cash_register.session_open',
      module: 'cash_register',
      entityId: session.id,
      entityType: 'CashSession',
      newData: {
        cashRegisterId: dto.cashRegisterId,
        cashRegisterName: session.cashRegister.name,
        openingAmount: dto.openingAmount.toFixed(2),
        status: CashSessionStatus.OPEN,
      },
    });

    return this.getSessionById(session.id, userId, false);
  }

  async getSessionById(id: string, userId: string, forceViewAll: boolean) {
    const s = await this.prisma.cashSession.findUnique({
      where: { id },
      include: {
        cashRegister: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { movements: true } },
      },
    });
    if (!s) throw new NotFoundException('Sesión no encontrada');
    if (!forceViewAll && !(await this.canViewSession(s.userId, userId))) {
      throw new ForbiddenException('No puede ver esta sesión');
    }
    return this.mapSessionDetail(s);
  }

  async listSessions(query: QuerySessionsDto, userId: string) {
    const perms = await this.authService.getUserPermissions(userId);
    const viewAll = perms.includes('cash_register.view_all');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CashSessionWhereInput = {};
    if (!query.allUsers || !viewAll) {
      where.userId = userId;
    }

    const [total, rows] = await Promise.all([
      this.prisma.cashSession.count({ where }),
      this.prisma.cashSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: {
          cashRegister: { select: { name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { movements: true } },
        },
      }),
    ]);

    return {
      data: rows.map((r) => this.mapSessionSummary(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async closeSession(id: string, dto: CloseSessionDto, userId: string) {
    const s = await this.prisma.cashSession.findUnique({
      where: { id },
      include: { movements: true },
    });
    if (!s) throw new NotFoundException('Sesión no encontrada');
    if (s.userId !== userId) {
      throw new ForbiddenException('Solo puede cerrar su propia sesión');
    }
    if (s.status !== CashSessionStatus.OPEN) {
      throw new BadRequestException('La sesión ya está cerrada');
    }

    const expected = expectedBalance(Number(s.openingAmount), s.movements);
    const closing = round2(dto.closingAmount);
    const diff = round2(closing - expected);

    const reg = await this.prisma.cashRegister.findUnique({
      where: { id: s.cashRegisterId },
      select: { name: true },
    });

    await this.prisma.cashSession.update({
      where: { id },
      data: {
        status: CashSessionStatus.CLOSED,
        closedAt: new Date(),
        closingAmount: new Prisma.Decimal(closing.toFixed(2)),
        expectedAmount: new Prisma.Decimal(expected.toFixed(2)),
        difference: new Prisma.Decimal(diff.toFixed(2)),
      },
    });

    await this.audit.record({
      userId,
      action: 'cash_register.session_close',
      module: 'cash_register',
      entityId: id,
      entityType: 'CashSession',
      oldData: {
        status: s.status,
        openingAmount: s.openingAmount.toString(),
        movementCount: s.movements.length,
      },
      newData: {
        cashRegisterName: reg?.name ?? null,
        closingAmount: closing.toFixed(2),
        expectedAmount: expected.toFixed(2),
        difference: diff.toFixed(2),
        status: CashSessionStatus.CLOSED,
      },
    });

    return this.getSessionById(id, userId, true);
  }

  async addMovement(sessionId: string, dto: CreateMovementDto, userId: string) {
    const s = await this.prisma.cashSession.findUnique({
      where: { id: sessionId },
    });
    if (!s) throw new NotFoundException('Sesión no encontrada');
    if (s.userId !== userId) {
      throw new ForbiddenException('Solo puede registrar movimientos en su sesión');
    }
    if (s.status !== CashSessionStatus.OPEN) {
      throw new BadRequestException('La sesión está cerrada');
    }

    await this.prisma.cashMovement.create({
      data: {
        sessionId,
        userId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description?.trim() || null,
      },
    });

    return this.getSessionById(sessionId, userId, true);
  }

  async getSessionReport(sessionId: string, userId: string) {
    const s = await this.prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: {
        cashRegister: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        movements: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        sales: {
          where: { status: SaleStatus.COMPLETED },
          orderBy: { paidAt: 'asc' },
          include: {
            customer: { select: { id: true, name: true, documentNumber: true } },
            user: { select: { id: true, firstName: true, lastName: true } },
            payments: true,
            items: {
              include: {
                product: { select: { id: true, sku: true, name: true, costPrice: true } },
              },
            },
            invoice: { select: { id: true, prefix: true, number: true, status: true, date: true } },
          },
        },
        _count: { select: { movements: true } },
      },
    });
    if (!s) throw new NotFoundException('Sesión no encontrada');
    if (!(await this.canViewSession(s.userId, userId))) {
      throw new ForbiddenException('No puede ver esta sesión');
    }

    const opening = Number(s.openingAmount);
    let incomeManual = 0;
    let expenseTotal = 0;
    let cashSalesFromMovements = 0;
    for (const m of s.movements) {
      const a = Number(m.amount);
      if (m.type === CashMovementType.INCOME) incomeManual += a;
      else if (m.type === CashMovementType.EXPENSE) expenseTotal += a;
      else if (m.type === CashMovementType.SALE) cashSalesFromMovements += a;
    }
    const expectedCash =
      s.status === CashSessionStatus.OPEN
        ? expectedBalance(opening, s.movements)
        : Number(s.expectedAmount ?? expectedBalance(opening, s.movements));

    let salesTotal = 0;
    let subtotalNet = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    let estimatedCost = 0;
    const paymentsByMethod = new Map<string, { count: number; total: number }>();
    const productMap = new Map<
      string,
      { productId: string; sku: string; name: string; quantity: number; revenue: number; cost: number }
    >();
    const customerMap = new Map<
      string,
      { customerId: string; name: string; documentNumber: string; salesCount: number; total: number }
    >();

    const sales = s.sales.map((sale) => {
      const total = Number(sale.total);
      salesTotal += total;
      subtotalNet += Number(sale.subtotal);
      taxTotal += Number(sale.taxTotal);
      discountTotal += Number(sale.discountTotal);

      for (const p of sale.payments) {
        const net = round2(Number(p.amount) - Number(p.change));
        const key = p.method;
        const prev = paymentsByMethod.get(key) ?? { count: 0, total: 0 };
        paymentsByMethod.set(key, { count: prev.count + 1, total: round2(prev.total + net) });
      }

      for (const it of sale.items) {
        const qty = qtyToNumber(it.quantity);
        const unitPrice = Number(it.unitPrice);
        const disc = Number(it.discount);
        const lineRev = round2(qty * (unitPrice - disc));
        const lineCost = round2(qty * Number(it.product.costPrice));
        estimatedCost += lineCost;

        const pid = it.product.id;
        const pp = productMap.get(pid) ?? {
          productId: pid,
          sku: it.product.sku,
          name: it.product.name,
          quantity: 0,
          revenue: 0,
          cost: 0,
        };
        pp.quantity += qty;
        pp.revenue = round2(pp.revenue + lineRev);
        pp.cost = round2(pp.cost + lineCost);
        productMap.set(pid, pp);
      }

      const custKey = sale.customer?.id ?? '__walkin__';
      const custLabel = sale.customer?.name ?? 'Cliente ocasional';
      const custDoc = sale.customer?.documentNumber ?? '—';
      const cc = customerMap.get(custKey) ?? {
        customerId: custKey,
        name: custLabel,
        documentNumber: custDoc,
        salesCount: 0,
        total: 0,
      };
      cc.salesCount += 1;
      cc.total = round2(cc.total + total);
      customerMap.set(custKey, cc);

      return {
        id: sale.id,
        number: sale.number,
        total: sale.total.toString(),
        subtotal: sale.subtotal.toString(),
        taxTotal: sale.taxTotal.toString(),
        discountTotal: sale.discountTotal.toString(),
        createdAt: sale.createdAt.toISOString(),
        paidAt: sale.paidAt?.toISOString() ?? sale.createdAt.toISOString(),
        seller: {
          id: sale.user.id,
          name: `${sale.user.firstName} ${sale.user.lastName}`.trim(),
        },
        customer: sale.customer
          ? {
              id: sale.customer.id,
              name: sale.customer.name,
              documentNumber: sale.customer.documentNumber,
            }
          : null,
        itemCount: sale.items.length,
        payments: sale.payments.map((p) => ({
          method: p.method,
          amount: p.amount.toString(),
          change: p.change.toString(),
          net: round2(Number(p.amount) - Number(p.change)).toFixed(2),
        })),
        items: sale.items.map((it) => ({
          productId: it.productId,
          sku: it.product.sku,
          name: it.product.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice.toString(),
          discount: it.discount.toString(),
          lineTotal: it.subtotal.toString(),
        })),
        invoice: sale.invoice
          ? {
              id: sale.invoice.id,
              fullNumber: `${sale.invoice.prefix}-${sale.invoice.number}`,
              status: sale.invoice.status,
              date: sale.invoice.date.toISOString(),
            }
          : null,
      };
    });

    const grossProfit = round2(salesTotal - estimatedCost);
    const marginPercent =
      salesTotal > 0 ? round2((grossProfit / salesTotal) * 100) : 0;

    const closing = s.closingAmount != null ? Number(s.closingAmount) : null;
    const difference = s.difference != null ? Number(s.difference) : null;

    let performance: 'good' | 'warning' | 'alert' = 'good';
    const performanceNotes: string[] = [];
    if (marginPercent < 15 && salesTotal > 0) {
      performance = 'warning';
      performanceNotes.push('Margen de utilidad bajo (< 15 %)');
    }
    if (s.status === CashSessionStatus.CLOSED && difference != null) {
      if (Math.abs(difference) < 1) {
        performanceNotes.push('Arqueo cuadrado (sin diferencia)');
      } else if (difference > 0) {
        performance = difference > 5000 ? 'alert' : 'warning';
        performanceNotes.push(`Sobra efectivo: ${difference.toFixed(2)}`);
      } else {
        performance = Math.abs(difference) > 5000 ? 'alert' : 'warning';
        performanceNotes.push(`Falta efectivo: ${Math.abs(difference).toFixed(2)}`);
      }
    }
    if (sales.length === 0 && s.status === CashSessionStatus.OPEN) {
      performanceNotes.push('Sin ventas registradas en este turno');
    }

    const topProducts = [...productMap.values()]
      .map((p) => ({
        ...p,
        profit: round2(p.revenue - p.cost),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    const topCustomers = [...customerMap.values()].sort((a, b) => b.total - a.total).slice(0, 15);

    return {
      session: {
        ...this.mapSessionSummary({
          ...s,
          cashRegister: { name: s.cashRegister.name },
          user: s.user,
          _count: s._count,
        }),
        cashierEmail: s.user.email,
        expectedCashNow: expectedCash.toFixed(2),
      },
      summary: {
        salesCount: sales.length,
        salesTotal: salesTotal.toFixed(2),
        subtotalNet: subtotalNet.toFixed(2),
        taxTotal: taxTotal.toFixed(2),
        discountTotal: discountTotal.toFixed(2),
        estimatedCost: estimatedCost.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        marginPercent,
        incomeManual: incomeManual.toFixed(2),
        expenseTotal: expenseTotal.toFixed(2),
        cashSalesFromMovements: cashSalesFromMovements.toFixed(2),
        expectedCash: expectedCash.toFixed(2),
        closingAmount: closing?.toFixed(2) ?? null,
        difference: difference?.toFixed(2) ?? null,
      },
      performance: {
        status: performance,
        notes: performanceNotes,
      },
      paymentsByMethod: [...paymentsByMethod.entries()].map(([method, v]) => ({
        method,
        count: v.count,
        total: v.total.toFixed(2),
      })),
      topProducts,
      topCustomers,
      sales,
      movements: s.movements.map((m) => ({
        id: m.id,
        type: m.type,
        amount: m.amount.toString(),
        description: m.description,
        createdAt: m.createdAt.toISOString(),
        userName: `${m.user.firstName} ${m.user.lastName}`.trim(),
        userId: m.userId,
      })),
    };
  }

  async adminUpdateSession(
    sessionId: string,
    dto: AdminUpdateSessionDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.assertCanManage(userId);
    const s = await this.prisma.cashSession.findUnique({ where: { id: sessionId } });
    if (!s) throw new NotFoundException('Sesión no encontrada');

    const data: Prisma.CashSessionUpdateInput = {};
    if (dto.openingAmount !== undefined) {
      data.openingAmount = new Prisma.Decimal(dto.openingAmount.toFixed(2));
    }
    if (dto.closingAmount !== undefined) {
      data.closingAmount = new Prisma.Decimal(dto.closingAmount.toFixed(2));
    }
    if (dto.expectedAmount !== undefined) {
      data.expectedAmount = new Prisma.Decimal(dto.expectedAmount.toFixed(2));
    }
    if (dto.difference !== undefined) {
      data.difference = new Prisma.Decimal(dto.difference.toFixed(2));
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.closedAt !== undefined) data.closedAt = new Date(dto.closedAt);

    await this.prisma.cashSession.update({ where: { id: sessionId }, data });

    await this.audit.record({
      userId,
      action: 'cash_register.session_adjust',
      module: 'cash_register',
      entityId: sessionId,
      entityType: 'CashSession',
      oldData: {
        openingAmount: s.openingAmount.toString(),
        closingAmount: s.closingAmount?.toString(),
        expectedAmount: s.expectedAmount?.toString(),
        difference: s.difference?.toString(),
        status: s.status,
      },
      newData: dto as Prisma.InputJsonValue,
      ipAddress: ipAddress ?? null,
    });

    return this.getSessionReport(sessionId, userId);
  }

  async adminUpdateMovement(
    sessionId: string,
    movementId: string,
    dto: AdminUpdateMovementDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.assertCanManage(userId);
    const mov = await this.prisma.cashMovement.findFirst({
      where: { id: movementId, sessionId },
    });
    if (!mov) throw new NotFoundException('Movimiento no encontrado');

    await this.prisma.cashMovement.update({
      where: { id: movementId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && {
          amount: new Prisma.Decimal(dto.amount.toFixed(2)),
        }),
        ...(dto.description !== undefined && {
          description: dto.description.trim() || null,
        }),
      },
    });

    await this.audit.record({
      userId,
      action: 'cash_register.movement_adjust',
      module: 'cash_register',
      entityId: movementId,
      entityType: 'CashMovement',
      oldData: {
        type: mov.type,
        amount: mov.amount.toString(),
        description: mov.description,
      },
      newData: dto as Prisma.InputJsonValue,
      ipAddress: ipAddress ?? null,
    });

    return this.getSessionReport(sessionId, userId);
  }

  async adminDeleteMovement(
    sessionId: string,
    movementId: string,
    userId: string,
    ipAddress?: string,
  ) {
    await this.assertCanManage(userId);
    const mov = await this.prisma.cashMovement.findFirst({
      where: { id: movementId, sessionId },
    });
    if (!mov) throw new NotFoundException('Movimiento no encontrado');

    await this.prisma.cashMovement.delete({ where: { id: movementId } });

    await this.audit.record({
      userId,
      action: 'cash_register.movement_delete',
      module: 'cash_register',
      entityId: movementId,
      entityType: 'CashMovement',
      oldData: {
        type: mov.type,
        amount: mov.amount.toString(),
        description: mov.description,
      },
      newData: null,
      ipAddress: ipAddress ?? null,
    });

    return this.getSessionReport(sessionId, userId);
  }
}
