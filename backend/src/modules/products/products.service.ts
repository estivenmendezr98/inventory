import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryStockService } from '../inventory/inventory-stock.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';
import { snapshotProduct } from '../audit/audit-snapshots.util';
import {
  qtyToNumber,
  roundQty,
  UNIT_CATEGORY_LABELS,
} from '../../common/utils/product-quantity.util';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from './dto/update-unit-of-measure.dto';
import { UnitCategory } from '@prisma/client';
import {
  fromBaseQuantity,
  listSaleUnitOptions,
  productUnitProfileFromRow,
} from '../../common/utils/product-unit-conversion.util';

const productUnitsInclude = {
  unitOfMeasure: true,
  contentUnit: true,
  alternateUnits: {
    include: { unitOfMeasure: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

function mapUnit(u: {
  id: string;
  code: string;
  name: string;
  symbol: string;
  category: string;
  allowsDecimals: boolean;
  decimalPlaces: number;
}) {
  return {
    id: u.id,
    code: u.code,
    name: u.name,
    symbol: u.symbol,
    category: u.category,
    categoryLabel: UNIT_CATEGORY_LABELS[u.category] ?? u.category,
    allowsDecimals: u.allowsDecimals,
    decimalPlaces: u.decimalPlaces,
  };
}

function toProductResponse(
  p: {
    id: string;
    sku: string;
    barcode: string | null;
    name: string;
    description: string | null;
    categoryId: string | null;
    unitOfMeasureId: string;
    measureDetail?: string | null;
    contentPerUnit?: Prisma.Decimal | null;
    contentUnitId?: string | null;
    costPrice: Prisma.Decimal;
    salePrice: Prisma.Decimal;
    taxRate: Prisma.Decimal;
    minStock: Prisma.Decimal;
    maxStock: Prisma.Decimal;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    category?: { id: string; name: string } | null;
    unitOfMeasure?: {
      id: string;
      code: string;
      name: string;
      symbol: string;
      category: string;
      allowsDecimals: boolean;
      decimalPlaces: number;
    };
    contentUnit?: {
      id: string;
      code: string;
      name: string;
      symbol: string;
      category: string;
      allowsDecimals: boolean;
      decimalPlaces: number;
    } | null;
    alternateUnits?: Array<{
      unitOfMeasureId: string;
      factorToBase: Prisma.Decimal;
      label: string | null;
      unitOfMeasure: {
        id: string;
        code: string;
        name: string;
        symbol: string;
        category: string;
        allowsDecimals: boolean;
        decimalPlaces: number;
      };
    }>;
    inventory?: Array<{ quantity: Prisma.Decimal; reservedQty: Prisma.Decimal }>;
  },
  reservedInOpenCarts?: number,
) {
  const inv = p.inventory?.[0];
  const unit = p.unitOfMeasure;
  const dp = unit?.decimalPlaces ?? 0;
  const physical = qtyToNumber(inv?.quantity);
  const reserved =
    reservedInOpenCarts !== undefined
      ? reservedInOpenCarts
      : qtyToNumber(inv?.reservedQty);
  const availableBase = Math.max(0, physical - reserved);
  const profile =
    unit &&
    productUnitProfileFromRow({
      unitOfMeasureId: p.unitOfMeasureId,
      contentPerUnit: p.contentPerUnit ?? null,
      contentUnitId: p.contentUnitId ?? null,
      unitOfMeasure: unit,
      contentUnit: p.contentUnit ?? null,
      alternateUnits: p.alternateUnits,
    });
  const contentPer = p.contentPerUnit != null ? qtyToNumber(p.contentPerUnit) : null;
  const firstAlt = profile?.alternateUnits[0];
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    category: p.category ?? null,
    unitOfMeasureId: p.unitOfMeasureId,
    measureDetail: p.measureDetail ?? null,
    contentPerUnit: contentPer,
    contentUnitId: p.contentUnitId ?? null,
    contentUnit: p.contentUnit ? mapUnit(p.contentUnit) : null,
    saleUnits: profile ? listSaleUnitOptions(profile) : [],
    alternateUnits: (p.alternateUnits ?? []).map((a) => ({
      unitOfMeasureId: a.unitOfMeasureId,
      factorToBase: qtyToNumber(a.factorToBase),
      label: a.label,
      unitOfMeasure: mapUnit(a.unitOfMeasure),
    })),
    unitOfMeasure: unit ? mapUnit(unit) : null,
    costPrice: p.costPrice.toString(),
    salePrice: p.salePrice.toString(),
    taxRate: p.taxRate.toString(),
    minStock: qtyToNumber(p.minStock),
    maxStock: qtyToNumber(p.maxStock),
    stock: roundQty(physical, dp),
    reservedQty: roundQty(reserved, dp),
    availableStock: roundQty(availableBase, dp),
    availableContentStock:
      profile && firstAlt
        ? fromBaseQuantity(availableBase, firstAlt.unitOfMeasureId, profile)
        : null,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryStock: InventoryStockService,
    private readonly audit: AuditService,
  ) {}

  /** Unidad por defecto desde BD (código UN o la primera activa). */
  async resolveDefaultUnitId(): Promise<string> {
    const preferred = await this.prisma.unitOfMeasure.findFirst({
      where: { isActive: true, code: 'UN' },
      select: { id: true },
    });
    if (preferred) return preferred.id;
    const any = await this.prisma.unitOfMeasure.findFirst({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true },
    });
    if (!any) {
      throw new BadRequestException(
        'No hay unidades de medida en la base de datos. Ejecute migraciones y seed.',
      );
    }
    return any.id;
  }

  async listUnitsOfMeasure() {
    const [rows, defaultUnitId] = await Promise.all([
      this.prisma.unitOfMeasure.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.resolveDefaultUnitId(),
    ]);
    const grouped: Record<string, ReturnType<typeof mapUnit>[]> = {};
    for (const r of rows) {
      const key = r.category;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(mapUnit(r));
    }
    return {
      defaultUnitId,
      units: rows.map(mapUnit),
      grouped: Object.entries(grouped).map(([category, units]) => ({
        category,
        categoryLabel: UNIT_CATEGORY_LABELS[category] ?? category,
        units,
      })),
    };
  }

  async createUnitOfMeasure(dto: CreateUnitOfMeasureDto) {
    const code = dto.code.trim().toUpperCase();
    const id = `uom-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (!id || id === 'uom-') {
      throw new BadRequestException('Código de unidad inválido');
    }
    const dupCode = await this.prisma.unitOfMeasure.findFirst({
      where: { OR: [{ code }, { id }] },
    });
    if (dupCode) {
      throw new ConflictException('Ya existe una unidad con ese código o id');
    }
    const allowsDecimals = dto.allowsDecimals ?? dto.category !== UnitCategory.COUNT;
    const decimalPlaces = allowsDecimals
      ? Math.min(4, Math.max(0, dto.decimalPlaces ?? (dto.category === UnitCategory.COUNT ? 0 : 3)))
      : 0;
    const maxSort = await this.prisma.unitOfMeasure.aggregate({
      _max: { sortOrder: true },
    });
    const created = await this.prisma.unitOfMeasure.create({
      data: {
        id,
        code,
        name: dto.name.trim(),
        symbol: dto.symbol.trim(),
        category: dto.category,
        allowsDecimals,
        decimalPlaces,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 10,
        isActive: true,
      },
    });
    return mapUnit(created);
  }

  async updateUnitOfMeasure(id: string, dto: UpdateUnitOfMeasureDto) {
    const existing = await this.prisma.unitOfMeasure.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Unidad de medida no encontrada');
    }
    if (dto.code !== undefined) {
      const code = dto.code.trim().toUpperCase();
      const dup = await this.prisma.unitOfMeasure.findFirst({
        where: { code, NOT: { id } },
      });
      if (dup) throw new ConflictException('Ya existe otra unidad con ese código');
    }
    const category = dto.category ?? existing.category;
    const allowsDecimals =
      dto.allowsDecimals !== undefined
        ? dto.allowsDecimals
        : dto.category !== undefined
          ? dto.category !== UnitCategory.COUNT
          : existing.allowsDecimals;
    const decimalPlaces =
      dto.decimalPlaces !== undefined
        ? allowsDecimals
          ? Math.min(4, Math.max(0, dto.decimalPlaces))
          : 0
        : allowsDecimals
          ? existing.decimalPlaces
          : 0;

    const updated = await this.prisma.unitOfMeasure.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.symbol !== undefined && { symbol: dto.symbol.trim() }),
        ...(dto.category !== undefined && { category: dto.category }),
        allowsDecimals,
        decimalPlaces,
      },
    });
    return mapUnit(updated);
  }

  async findCategoriesForSelect() {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { categories: rows };
  }

  /** Autocompletado para filtros (kardex, compras, etc.) */
  async searchOptions(q?: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (q?.trim()) {
      const s = q.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { barcode: { contains: s, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.product.findMany({
      where,
      take,
      orderBy: { name: 'asc' },
      select: { id: true, sku: true, name: true },
    });
    return { products: rows };
  }

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (!query.includeInactive) {
      where.isActive = true;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { barcode: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, rows, reservedMap] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          category: { select: { id: true, name: true } },
          ...productUnitsInclude,
          inventory: { select: { quantity: true, reservedQty: true }, take: 1 },
        },
      }),
      this.inventoryStock.getOpenCartReservedByProduct(
        this.prisma,
        query.excludeCartId,
      ),
    ]);

    return {
      data: rows.map((r) => toProductResponse(r, reservedMap.get(r.id) ?? 0)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        ...productUnitsInclude,
        inventory: { select: { quantity: true, reservedQty: true }, take: 1 },
      },
    });
    if (!p) {
      throw new NotFoundException('Producto no encontrado');
    }
    return toProductResponse(p);
  }

  private async assertAlternateUnits(
    baseUnitId: string,
    units?: Array<{ unitOfMeasureId: string; factorToBase: number; label?: string }>,
  ) {
    if (!units?.length) return;
    const seen = new Set<string>();
    for (const alt of units) {
      if (alt.unitOfMeasureId === baseUnitId) {
        throw new BadRequestException(
          'Las unidades alternas deben ser distintas a la unidad base',
        );
      }
      if (seen.has(alt.unitOfMeasureId)) {
        throw new BadRequestException('No repita la misma unidad alterna');
      }
      seen.add(alt.unitOfMeasureId);
      if (alt.factorToBase <= 0) {
        throw new BadRequestException('El factor de conversión debe ser mayor que cero');
      }
      await this.assertUnitOfMeasure(alt.unitOfMeasureId);
    }
  }

  private async syncAlternateUnits(
    productId: string,
    baseUnitId: string,
    units?: Array<{ unitOfMeasureId: string; factorToBase: number; label?: string }>,
    legacy?: { contentPerUnit?: number | null; contentUnitId?: string | null },
  ) {
    await this.prisma.productAlternateUnit.deleteMany({ where: { productId } });
    let rows = units ?? [];
    if (
      rows.length === 0 &&
      legacy?.contentUnitId &&
      legacy.contentPerUnit != null &&
      legacy.contentPerUnit > 0
    ) {
      rows = [
        {
          unitOfMeasureId: legacy.contentUnitId,
          factorToBase: 1 / legacy.contentPerUnit,
        },
      ];
    }
    await this.assertAlternateUnits(baseUnitId, rows);
    for (let i = 0; i < rows.length; i++) {
      const alt = rows[i]!;
      await this.prisma.productAlternateUnit.create({
        data: {
          productId,
          unitOfMeasureId: alt.unitOfMeasureId,
          factorToBase: new Prisma.Decimal(alt.factorToBase.toFixed(6)),
          label: alt.label?.trim() || null,
          sortOrder: i,
        },
      });
    }
  }

  private legacyContentFromDto(dto: {
    contentPerUnit?: number;
    contentUnitId?: string;
    alternateUnits?: Array<{ unitOfMeasureId: string; factorToBase: number }>;
  }): { contentPerUnit: number | null; contentUnitId: string | null } {
    if (dto.alternateUnits?.length === 1 && !dto.contentUnitId) {
      const alt = dto.alternateUnits[0]!;
      return {
        contentPerUnit: alt.factorToBase > 0 ? 1 / alt.factorToBase : null,
        contentUnitId: alt.unitOfMeasureId,
      };
    }
    return {
      contentPerUnit: dto.contentPerUnit ?? null,
      contentUnitId: dto.contentUnitId ?? null,
    };
  }

  private async assertUnitOfMeasure(unitOfMeasureId: string) {
    const uom = await this.prisma.unitOfMeasure.findFirst({
      where: { id: unitOfMeasureId, isActive: true },
    });
    if (!uom) {
      throw new BadRequestException('Unidad de medida no válida o inactiva');
    }
    return uom;
  }

  private async assertCategory(categoryId?: string) {
    if (!categoryId) return;
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
    });
    if (!cat) {
      throw new BadRequestException('Categoría no válida o inactiva');
    }
  }

  async create(dto: CreateProductDto, actorUserId?: string, ipAddress?: string) {
    const sku = dto.sku.trim();
    const dupSku = await this.prisma.product.findUnique({ where: { sku } });
    if (dupSku) {
      throw new ConflictException('Ya existe un producto con ese SKU');
    }
    if (dto.barcode) {
      const dupBc = await this.prisma.product.findUnique({
        where: { barcode: dto.barcode },
      });
      if (dupBc) {
        throw new ConflictException('Ya existe un producto con ese código de barras');
      }
    }
    await this.assertCategory(dto.categoryId);
    const uom = await this.assertUnitOfMeasure(dto.unitOfMeasureId);
    await this.assertAlternateUnits(dto.unitOfMeasureId, dto.alternateUnits);
    const legacyContent = this.legacyContentFromDto(dto);

    const min = dto.minStock ?? 0;
    const max = dto.maxStock ?? 0;
    if (max > 0 && min > max) {
      throw new BadRequestException('minStock no puede ser mayor que maxStock');
    }

    const created = await this.prisma.product.create({
      data: {
        sku,
        barcode: dto.barcode ?? null,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        categoryId: dto.categoryId ?? null,
        unitOfMeasureId: uom.id,
        measureDetail: dto.measureDetail?.trim() || null,
        contentPerUnit:
          legacyContent.contentPerUnit != null
            ? new Prisma.Decimal(legacyContent.contentPerUnit.toFixed(4))
            : null,
        contentUnitId: legacyContent.contentUnitId,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        taxRate: dto.taxRate ?? 0,
        minStock: new Prisma.Decimal((dto.minStock ?? 0).toFixed(4)),
        maxStock: new Prisma.Decimal((dto.maxStock ?? 0).toFixed(4)),
        imageUrl: dto.imageUrl?.trim() ?? null,
        inventory: {
          create: { quantity: 0, reservedQty: 0 },
        },
      },
      include: {
        category: { select: { id: true, name: true } },
        ...productUnitsInclude,
        inventory: { select: { quantity: true, reservedQty: true }, take: 1 },
      },
    });

    await this.syncAlternateUnits(created.id, uom.id, dto.alternateUnits, legacyContent);

    const withUnits = await this.prisma.product.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        category: { select: { id: true, name: true } },
        ...productUnitsInclude,
        inventory: { select: { quantity: true, reservedQty: true }, take: 1 },
      },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'product.create',
        module: 'products',
        entityId: created.id,
        entityType: 'Product',
        newData: snapshotProduct(withUnits),
        ipAddress: ipAddress ?? null,
      });
    }

    return toProductResponse(withUnits);
  }

  async update(id: string, dto: UpdateProductDto, actorUserId?: string, ipAddress?: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (dto.sku !== undefined) {
      const sku = dto.sku.trim();
      const dup = await this.prisma.product.findFirst({
        where: { sku, NOT: { id } },
      });
      if (dup) throw new ConflictException('Ya existe un producto con ese SKU');
    }
    if (dto.barcode !== undefined && dto.barcode !== null && dto.barcode !== '') {
      const dup = await this.prisma.product.findFirst({
        where: { barcode: dto.barcode, NOT: { id } },
      });
      if (dup) throw new ConflictException('Ya existe un producto con ese código de barras');
    }
    if (dto.categoryId !== undefined) {
      await this.assertCategory(dto.categoryId ?? undefined);
    }
    if (dto.unitOfMeasureId !== undefined) {
      await this.assertUnitOfMeasure(dto.unitOfMeasureId);
    }
    const invUnitId = dto.unitOfMeasureId ?? existing.unitOfMeasureId;
    const nextContentPer =
      dto.contentPerUnit !== undefined
        ? dto.contentPerUnit
        : existing.contentPerUnit != null
          ? qtyToNumber(existing.contentPerUnit)
          : undefined;
    const nextContentUnitId =
      dto.contentUnitId !== undefined ? dto.contentUnitId : existing.contentUnitId;
    if (dto.alternateUnits !== undefined) {
      await this.assertAlternateUnits(invUnitId, dto.alternateUnits);
    }

    const min = dto.minStock ?? qtyToNumber(existing.minStock);
    const max = dto.maxStock ?? qtyToNumber(existing.maxStock);
    if (max > 0 && min > max) {
      throw new BadRequestException('minStock no puede ser mayor que maxStock');
    }

    const oldSnapshot = snapshotProduct({
      ...existing,
      category: null,
      unitOfMeasure: await this.prisma.unitOfMeasure.findUnique({
        where: { id: existing.unitOfMeasureId },
      }),
      inventory: await this.prisma.inventory.findMany({
        where: { productId: id },
        select: { quantity: true, reservedQty: true },
        take: 1,
      }),
    });

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.sku !== undefined && { sku: dto.sku.trim() }),
        ...(dto.barcode !== undefined && {
          barcode: dto.barcode === '' ? null : dto.barcode,
        }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() ?? null,
        }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.unitOfMeasureId !== undefined && {
          unitOfMeasureId: dto.unitOfMeasureId,
        }),
        ...(dto.measureDetail !== undefined && {
          measureDetail: dto.measureDetail?.trim() || null,
        }),
        ...(dto.contentPerUnit !== undefined && {
          contentPerUnit:
            dto.contentPerUnit == null
              ? null
              : new Prisma.Decimal(dto.contentPerUnit.toFixed(4)),
        }),
        ...(dto.contentUnitId !== undefined && {
          contentUnitId: dto.contentUnitId || null,
        }),
        ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
        ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
        ...(dto.minStock !== undefined && {
          minStock: new Prisma.Decimal(dto.minStock.toFixed(4)),
        }),
        ...(dto.maxStock !== undefined && {
          maxStock: new Prisma.Decimal(dto.maxStock.toFixed(4)),
        }),
        ...(dto.imageUrl !== undefined && {
          imageUrl: dto.imageUrl?.trim() ?? null,
        }),
      },
      include: {
        category: { select: { id: true, name: true } },
        ...productUnitsInclude,
        inventory: { select: { quantity: true, reservedQty: true }, take: 1 },
      },
    });

    if (dto.alternateUnits !== undefined) {
      const legacy =
        dto.contentPerUnit !== undefined || dto.contentUnitId !== undefined
          ? {
              contentPerUnit: nextContentPer ?? null,
              contentUnitId: nextContentUnitId ?? null,
            }
          : undefined;
      await this.syncAlternateUnits(id, invUnitId, dto.alternateUnits, legacy);
    } else if (dto.contentPerUnit !== undefined || dto.contentUnitId !== undefined) {
      await this.syncAlternateUnits(id, invUnitId, undefined, {
        contentPerUnit: nextContentPer ?? null,
        contentUnitId: nextContentUnitId ?? null,
      });
    }

    const refreshed = await this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        ...productUnitsInclude,
        inventory: { select: { quantity: true, reservedQty: true }, take: 1 },
      },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'product.update',
        module: 'products',
        entityId: id,
        entityType: 'Product',
        oldData: oldSnapshot,
        newData: snapshotProduct(refreshed),
        ipAddress: ipAddress ?? null,
      });
    }

    return toProductResponse(refreshed);
  }

  /** Productos con SKU numérico 0–740 (típico de importación errónea). */
  async listNumericImportCandidates(maxSku = 740) {
    const rows = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        inventory: { select: { quantity: true } },
      },
      orderBy: { sku: 'asc' },
      take: 5000,
    });
    const candidates = rows.filter((p) => this.isBadNumericImportSku(p.sku, p.name, maxSku));
    return {
      maxSku,
      count: candidates.length,
      items: candidates.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: qtyToNumber(p.inventory[0]?.quantity ?? 0),
      })),
    };
  }

  async purgeNumericImportCandidates(
    dryRun: boolean,
    maxSku = 740,
    actorUserId?: string,
    ipAddress?: string,
  ) {
    const { items } = await this.listNumericImportCandidates(maxSku);
    if (dryRun) {
      return { dryRun: true, deleted: 0, wouldDelete: items.length, items };
    }
    let deleted = 0;
    for (const item of items) {
      await this.softDelete(item.id, actorUserId, ipAddress);
      deleted++;
    }
    return { dryRun: false, deleted, wouldDelete: items.length, items: [] };
  }

  private isBadNumericImportSku(sku: string, name: string, maxSku: number): boolean {
    if (!/^\d+$/.test(sku.trim())) return false;
    const n = parseInt(sku, 10);
    if (n < 0 || n > maxSku) return false;
    const nm = name.trim().toLowerCase();
    if (!nm) return true;
    if (nm === sku.trim()) return true;
    if (/^producto\s*\d*$/i.test(nm)) return true;
    if (/^item\s*\d*$/i.test(nm)) return true;
    if (/^sin nombre$/i.test(nm)) return true;
    return false;
  }

  /** Baja lógica — cumple restricciones FK con ventas históricas. */
  async softDelete(id: string, actorUserId?: string, ipAddress?: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'product.deactivate',
        module: 'products',
        entityId: id,
        entityType: 'Product',
        oldData: snapshotProduct(existing),
        newData: { isActive: false },
        ipAddress: ipAddress ?? null,
      });
    }

    return { success: true as const };
  }
}
