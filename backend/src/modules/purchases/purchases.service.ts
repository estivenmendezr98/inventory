import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KardexType, Prisma, PurchaseStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseDto, PurchaseLineInputDto } from './dto/create-purchase.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { AuditService } from '../audit/audit.service';
import { auditJson, snapshotPurchase } from '../audit/audit-snapshots.util';
import { buildKardexCreateData } from '../../common/utils/kardex-movement.util';
import { normalizePurchaseLines } from '../../common/utils/purchase-lines.util';
import {
  factorForUnit,
  productUnitProfileFromRow,
} from '../../common/utils/product-unit-conversion.util';
import { qtyToNumber, toQtyDecimal } from '../../common/utils/product-quantity.util';

function computeTotals(items: PurchaseLineInputDto[]) {
  let subtotal = 0;
  let taxTotal = 0;
  const lines: Array<
    PurchaseLineInputDto & { lineSubtotal: number; lineTax: number }
  > = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.productId)) {
      throw new BadRequestException('No repita el mismo producto en las líneas');
    }
    seen.add(it.productId);
    const base = it.quantity * it.unitCost;
    const tax = base * (it.taxRate / 100);
    subtotal += base;
    taxTotal += tax;
    lines.push({ ...it, lineSubtotal: base, lineTax: tax });
  }
  return {
    lines,
    subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
    taxTotal: new Prisma.Decimal(taxTotal.toFixed(2)),
    total: new Prisma.Decimal((subtotal + taxTotal).toFixed(2)),
  };
}

async function uniquePurchaseNumber(prisma: PrismaService): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const n = `OC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const dup = await prisma.purchase.findUnique({ where: { number: n } });
    if (!dup) return n;
  }
  throw new ConflictException('No se pudo generar número de orden único');
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async loadPurchaseAuditSnapshot(purchaseId: string) {
    const p = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { sku: true, name: true } } } },
      },
    });
    return p ? snapshotPurchase(p) : null;
  }

  private mapListRow(p: {
    id: string;
    number: string;
    date: Date;
    subtotal: Prisma.Decimal;
    taxTotal: Prisma.Decimal;
    total: Prisma.Decimal;
    status: PurchaseStatus;
    notes: string | null;
    createdAt: Date;
    supplier: { id: string; name: string; nit: string };
    user: { id: string; firstName: string; lastName: string };
    _count?: { items: number };
    lineCount?: number;
  }) {
    const lineCount = p.lineCount ?? p._count?.items ?? 0;
    return {
      id: p.id,
      number: p.number,
      date: p.date.toISOString(),
      subtotal: p.subtotal.toString(),
      taxTotal: p.taxTotal.toString(),
      total: p.total.toString(),
      status: p.status,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      supplier: p.supplier,
      user: {
        id: p.user.id,
        name: `${p.user.firstName} ${p.user.lastName}`.trim(),
      },
      lineCount,
    };
  }

  async findAll(query: QueryPurchasesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { number: { contains: s, mode: 'insensitive' } },
        { supplier: { name: { contains: s, mode: 'insensitive' } } },
        { supplier: { nit: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.purchase.count({ where }),
      this.prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          supplier: { select: { id: true, name: true, nit: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return {
      data: rows.map((r) => this.mapListRow(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const p = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, nit: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true } },
          },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!p) throw new NotFoundException('Compra no encontrada');

    const base = this.mapListRow({
      ...p,
      supplier: p.supplier,
      user: p.user,
      lineCount: p.items.length,
    });

    return {
      ...base,
      updatedAt: p.updatedAt.toISOString(),
      user: {
        id: p.user.id,
        name: `${p.user.firstName} ${p.user.lastName}`.trim(),
        email: p.user.email,
      },
      items: p.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitCost.toString(),
        taxRate: it.taxRate.toString(),
        subtotal: it.subtotal.toString(),
        product: it.product,
      })),
    };
  }

  private async assertSupplier(supplierId: string) {
    const s = await this.prisma.supplier.findFirst({
      where: { id: supplierId, isActive: true },
    });
    if (!s) throw new BadRequestException('Proveedor no válido o inactivo');
  }

  private async assertProducts(productIds: string[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no existen o están inactivos');
    }
  }

  private async applyReceipt(
    tx: Prisma.TransactionClient,
    purchaseId: string,
    userId: string,
  ) {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });
    if (!purchase) throw new NotFoundException('Compra no encontrada');
    if (purchase.status === PurchaseStatus.RECEIVED) return;
    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('No se puede recibir una compra cancelada');
    }

    for (const item of purchase.items) {
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
      if (!product) throw new BadRequestException(`Producto ${item.productId} no encontrado`);

      let inv = product.inventory[0];
      if (!inv) {
        inv = await tx.inventory.create({
          data: { productId: product.id, quantity: 0, reservedQty: 0 },
        });
      }

      const prev = qtyToNumber(inv.quantity);
      const delta = qtyToNumber(item.baseQuantity);
      const opQty = qtyToNumber(item.quantity);
      const next = prev + delta;
      const nextDec = toQtyDecimal(next);
      const prevDec = toQtyDecimal(prev);
      const unitCost = item.unitCost;
      const totalCost = new Prisma.Decimal(Number(unitCost) * opQty);

      const profile = productUnitProfileFromRow(product);
      const unitId = item.purchaseUnitId ?? product.unitOfMeasureId;

      await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: nextDec },
      });

      await tx.kardexEntry.create({
        data: buildKardexCreateData({
          productId: product.id,
          type: KardexType.IN,
          baseDelta: delta,
          previousStock: prev,
          newStock: next,
          unitCost,
          totalCost,
          referenceType: 'Purchase',
          referenceId: purchase.id,
          notes: `Recepción ${purchase.number}`,
          userId,
          operationalQuantity: opQty,
          operationalUnitId: unitId,
          conversionFactor: factorForUnit(profile, unitId),
        }),
      });
    }

    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: PurchaseStatus.RECEIVED },
    });
  }

  async create(dto: CreatePurchaseDto, userId: string) {
    await this.assertSupplier(dto.supplierId);
    const productIds = dto.items.map((i) => i.productId);
    await this.assertProducts(productIds);
    const number = await uniquePurchaseNumber(this.prisma);

    const purchase = await this.prisma.$transaction(async (tx) => {
      const normalized = await normalizePurchaseLines(tx, dto.items);
      const { lines, subtotal, taxTotal, total } = computeTotals(normalized);
      const subByProduct = new Map(lines.map((l) => [l.productId, l] as const));
      return tx.purchase.create({
        data: {
          supplierId: dto.supplierId,
          number,
          date: new Date(dto.date),
          subtotal,
          taxTotal,
          total,
          status: PurchaseStatus.DRAFT,
          notes: dto.notes?.trim() || null,
          userId,
          items: {
            create: normalized.map((l) => {
              const computed = subByProduct.get(l.productId)!;
              return {
                productId: l.productId,
                quantity: toQtyDecimal(l.quantity),
                baseQuantity: toQtyDecimal(l.baseQuantity),
                purchaseUnitId: l.purchaseUnitId,
                unitCost: l.unitCost,
                taxRate: l.taxRate,
                subtotal: new Prisma.Decimal(computed.lineSubtotal.toFixed(2)),
              };
            }),
          },
        },
      });
    });

    const snap = await this.loadPurchaseAuditSnapshot(purchase.id);
    if (snap) {
      await this.audit.record({
        userId,
        action: 'purchase.create',
        module: 'purchases',
        entityId: purchase.id,
        entityType: 'Purchase',
        newData: snap,
      });
    }

    return this.findOne(purchase.id);
  }

  async update(id: string, dto: UpdatePurchaseDto, userId: string, ipAddress?: string) {
    const existing = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { sku: true, name: true } } } },
        supplier: { select: { id: true, name: true } },
      },
    });
    if (!existing) throw new NotFoundException('Compra no encontrada');
    const oldSnap = snapshotPurchase(existing);

    if (
      existing.status === PurchaseStatus.RECEIVED ||
      existing.status === PurchaseStatus.CANCELLED
    ) {
      if (
        dto.supplierId !== undefined ||
        dto.date !== undefined ||
        dto.items !== undefined ||
        dto.status !== undefined
      ) {
        throw new BadRequestException(
          'No se puede modificar una compra recibida o cancelada',
        );
      }
      if (dto.notes !== undefined) {
        await this.prisma.purchase.update({
          where: { id },
          data: { notes: dto.notes?.trim() || null },
        });
      }
      return this.findOne(id);
    }

    if (dto.status === PurchaseStatus.RECEIVED) {
      await this.prisma.$transaction(async (tx) => {
        await this.applyReceipt(tx, id, userId);
      });
      const newSnap = await this.loadPurchaseAuditSnapshot(id);
      await this.audit.record({
        userId,
        action: 'purchase.update',
        module: 'purchases',
        entityId: id,
        entityType: 'Purchase',
        oldData: oldSnap,
        newData: auditJson({ ...(newSnap ?? {}), statusChange: 'RECEIVED' }),
        ipAddress: ipAddress ?? null,
      });
      return this.findOne(id);
    }

    if (dto.status === PurchaseStatus.CANCELLED) {
      if (
        dto.items !== undefined ||
        dto.supplierId !== undefined ||
        dto.date !== undefined
      ) {
        throw new BadRequestException(
          'Al cancelar solo puede enviar notas opcionales junto al estado',
        );
      }
      await this.prisma.purchase.update({
        where: { id },
        data: {
          status: PurchaseStatus.CANCELLED,
          ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
        },
      });
      await this.audit.record({
        userId,
        action: 'purchase.cancel',
        module: 'purchases',
        entityId: id,
        entityType: 'Purchase',
        oldData: oldSnap,
        newData: { status: PurchaseStatus.CANCELLED, notes: dto.notes ?? null },
        ipAddress: ipAddress ?? null,
      });
      return this.findOne(id);
    }

    if (
      dto.status !== undefined &&
      existing.status === PurchaseStatus.ORDERED &&
      dto.status === PurchaseStatus.DRAFT
    ) {
      throw new BadRequestException('No se puede volver a borrador desde una orden emitida');
    }

    if (existing.status === PurchaseStatus.ORDERED && dto.items !== undefined) {
      throw new BadRequestException(
        'No se pueden editar líneas de una orden emitida; cancele y cree una nueva',
      );
    }

    if (dto.supplierId !== undefined) {
      await this.assertSupplier(dto.supplierId);
    }

    let subtotal = existing.subtotal;
    let taxTotal = existing.taxTotal;
    let total = existing.total;
    let lineRows:
      | Array<{
          productId: string;
          quantity: number;
          unitCost: number;
          taxRate: number;
          subtotal: Prisma.Decimal;
        }>
      | undefined;

    let normalizedItems: Awaited<ReturnType<typeof normalizePurchaseLines>> | undefined;

    if (dto.items !== undefined) {
      const productIds = dto.items.map((i) => i.productId);
      await this.assertProducts(productIds);
      normalizedItems = await normalizePurchaseLines(this.prisma, dto.items);
      const computed = computeTotals(normalizedItems);
      subtotal = computed.subtotal;
      taxTotal = computed.taxTotal;
      total = computed.total;
      lineRows = computed.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitCost: l.unitCost,
        taxRate: l.taxRate,
        subtotal: new Prisma.Decimal(l.lineSubtotal.toFixed(2)),
      }));
    }

    await this.prisma.$transaction(async (tx) => {
      if (lineRows && normalizedItems) {
        await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
        await tx.purchaseItem.createMany({
          data: normalizedItems.map((l) => ({
            purchaseId: id,
            productId: l.productId,
            quantity: toQtyDecimal(l.quantity),
            baseQuantity: toQtyDecimal(l.baseQuantity),
            purchaseUnitId: l.purchaseUnitId,
            unitCost: l.unitCost,
            taxRate: l.taxRate,
            subtotal: new Prisma.Decimal(
              (l.quantity * l.unitCost * (1 + l.taxRate / 100)).toFixed(2),
            ),
          })),
        });
      }

      await tx.purchase.update({
        where: { id },
        data: {
          ...(dto.supplierId !== undefined && { supplierId: dto.supplierId }),
          ...(dto.date !== undefined && { date: new Date(dto.date) }),
          ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
          ...(lineRows !== undefined && { subtotal, taxTotal, total }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      });
    });

    const newSnap = await this.loadPurchaseAuditSnapshot(id);
    await this.audit.record({
      userId,
      action: 'purchase.update',
      module: 'purchases',
      entityId: id,
      entityType: 'Purchase',
      oldData: oldSnap,
      newData: auditJson(newSnap ?? { request: dto }),
      ipAddress: ipAddress ?? null,
    });

    return this.findOne(id);
  }

  async remove(id: string, userId: string, ipAddress?: string) {
    const existing = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { sku: true, name: true } } } },
      },
    });
    if (!existing) throw new NotFoundException('Compra no encontrada');

    if (existing.status === PurchaseStatus.DRAFT) {
      await this.audit.record({
        userId,
        action: 'purchase.delete',
        module: 'purchases',
        entityId: id,
        entityType: 'Purchase',
        oldData: snapshotPurchase(existing),
        newData: null,
        ipAddress: ipAddress ?? null,
      });
      await this.prisma.purchase.delete({ where: { id } });
      return { deleted: true as const };
    }

    if (existing.status === PurchaseStatus.RECEIVED) {
      throw new BadRequestException(
        'No se puede eliminar una compra recibida (ya impactó inventario)',
      );
    }

    await this.prisma.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.CANCELLED },
    });
    await this.audit.record({
      userId,
      action: 'purchase.cancel',
      module: 'purchases',
      entityId: id,
      entityType: 'Purchase',
      oldData: snapshotPurchase(existing),
      newData: { status: PurchaseStatus.CANCELLED },
      ipAddress: ipAddress ?? null,
    });
    return { cancelled: true as const };
  }
}
