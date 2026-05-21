import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private categorySnap(c: {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    isActive?: boolean;
    parent?: { name: string } | null;
  }) {
    return {
      categoryId: c.id,
      name: c.name,
      description: c.description,
      parentId: c.parentId,
      parentName: c.parent?.name ?? null,
      isActive: c.isActive ?? true,
    };
  }

  private async assertParent(parentId: string | undefined, excludeCategoryId?: string) {
    if (!parentId) return;
    if (excludeCategoryId && parentId === excludeCategoryId) {
      throw new BadRequestException('La categoría no puede ser padre de sí misma');
    }
    const parent = await this.prisma.category.findFirst({
      where: { id: parentId, isActive: true },
    });
    if (!parent) {
      throw new BadRequestException('Categoría padre no válida o inactiva');
    }
  }

  /** true si candidateId está en el subárbol de rootId (incluye nietos). */
  private async isUnderSubtree(rootId: string, candidateId: string): Promise<boolean> {
    const queue = [rootId];
    const seen = new Set<string>();
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const children = await this.prisma.category.findMany({
        where: { parentId: id },
        select: { id: true },
      });
      for (const ch of children) {
        if (ch.id === candidateId) return true;
        queue.push(ch.id);
      }
    }
    return false;
  }

  private async assertParentNotCircular(categoryId: string, newParentId: string | null) {
    if (!newParentId) return;
    if (newParentId === categoryId) {
      throw new BadRequestException('La categoría no puede ser padre de sí misma');
    }
    const under = await this.isUnderSubtree(categoryId, newParentId);
    if (under) {
      throw new BadRequestException('No puede asignar como padre un descendiente de esta categoría');
    }
  }

  private mapRow(c: {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    parent?: { id: string; name: string } | null;
    _count?: { products: number };
  }) {
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      parentId: c.parentId,
      parent: c.parent ?? null,
      imageUrl: c.imageUrl,
      isActive: c.isActive,
      productCount: c._count?.products ?? undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async findAll(query: QueryCategoriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};
    if (!query.includeInactive) {
      where.isActive = true;
    }
    if (query.parentId !== undefined && query.parentId !== '') {
      where.parentId = query.parentId === 'null' ? null : query.parentId;
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.name = { contains: s, mode: 'insensitive' };
    }

    const [total, rows] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true } },
        },
      }),
    ]);

    return {
      data: rows.map((r) => this.mapRow(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /** Lista plana para selects (productos, filtros). */
  async findActiveFlat() {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, parentId: true },
      orderBy: { name: 'asc' },
    });
    return { categories: rows };
  }

  async findOne(id: string) {
    const c = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });
    if (!c) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return this.mapRow(c);
  }

  async create(dto: CreateCategoryDto, actorUserId?: string, ipAddress?: string) {
    const name = dto.name.trim();
    const dup = await this.prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        parentId: dto.parentId ?? null,
      },
    });
    if (dup) {
      throw new ConflictException('Ya existe una categoría con ese nombre en el mismo nivel');
    }
    await this.assertParent(dto.parentId);

    const created = await this.prisma.category.create({
      data: {
        name,
        description: dto.description?.trim() ?? null,
        parentId: dto.parentId ?? null,
        imageUrl: dto.imageUrl?.trim() ?? null,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'category.create',
        module: 'categories',
        entityId: created.id,
        entityType: 'Category',
        newData: this.categorySnap(created),
        ipAddress: ipAddress ?? null,
      });
    }

    return this.mapRow(created);
  }

  async update(id: string, dto: UpdateCategoryDto, actorUserId?: string, ipAddress?: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: { select: { name: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Categoría no encontrada');
    }
    const oldSnap = this.categorySnap(existing);

    const newParentId =
      dto.parentId !== undefined ? dto.parentId : existing.parentId;
    await this.assertParent(newParentId ?? undefined, id);
    if (dto.parentId !== undefined) {
      await this.assertParentNotCircular(id, dto.parentId);
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const dup = await this.prisma.category.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          parentId: newParentId ?? null,
          NOT: { id },
        },
      });
      if (dup) {
        throw new ConflictException('Ya existe una categoría con ese nombre en el mismo nivel');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() ?? null,
        }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.imageUrl !== undefined && {
          imageUrl: dto.imageUrl?.trim() ?? null,
        }),
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'category.update',
        module: 'categories',
        entityId: id,
        entityType: 'Category',
        oldData: oldSnap,
        newData: this.categorySnap(updated),
        ipAddress: ipAddress ?? null,
      });
    }

    return this.mapRow(updated);
  }

  async softDelete(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Categoría no encontrada');
    }
    if (existing._count.products > 0) {
      throw new BadRequestException(
        'No se puede desactivar: hay productos asociados. Reasigne los productos primero.',
      );
    }
    const children = await this.prisma.category.count({
      where: { parentId: id },
    });
    if (children > 0) {
      throw new BadRequestException(
        'No se puede desactivar: existen subcategorías. Reubíquelas o desactívelas primero.',
      );
    }
    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true as const };
  }
}
