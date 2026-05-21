import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { AuditService } from '../audit/audit.service';
import { snapshotParty } from '../audit/audit-snapshots.util';

function normalizeNit(nit: string): string {
  return nit.replace(/\s+/g, '').trim();
}

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private mapRow(s: {
    id: string;
    nit: string;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { purchases: number };
  }) {
    return {
      id: s.id,
      nit: s.nit,
      name: s.name,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      address: s.address,
      city: s.city,
      isActive: s.isActive,
      purchaseCount: s._count?.purchases,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  async findActiveOptions() {
    const rows = await this.prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, nit: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { suppliers: rows };
  }

  async findAll(query: QuerySuppliersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {};
    if (!query.includeInactive) {
      where.isActive = true;
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { nit: { contains: s, mode: 'insensitive' } },
        { contactName: { contains: s, mode: 'insensitive' } },
        { city: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { purchases: true } } },
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

  async findOne(id: string) {
    const s = await this.prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { purchases: true } } },
    });
    if (!s) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    return this.mapRow(s);
  }

  private supplierSnap(s: {
    id: string;
    nit: string;
    name: string;
    email: string | null;
    phone: string | null;
    isActive?: boolean;
  }) {
    return snapshotParty({
      id: s.id,
      name: s.name,
      documentType: 'NIT',
      documentNumber: s.nit,
      email: s.email,
      phone: s.phone,
      isActive: s.isActive ?? true,
    });
  }

  async create(dto: CreateSupplierDto, actorUserId?: string, ipAddress?: string) {
    const nit = normalizeNit(dto.nit);
    const dup = await this.prisma.supplier.findUnique({ where: { nit } });
    if (dup) {
      throw new ConflictException('Ya existe un proveedor con ese NIT');
    }

    const created = await this.prisma.supplier.create({
      data: {
        nit,
        name: dto.name.trim(),
        contactName: dto.contactName?.trim() || null,
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
      },
      include: { _count: { select: { purchases: true } } },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'supplier.create',
        module: 'suppliers',
        entityId: created.id,
        entityType: 'Supplier',
        newData: this.supplierSnap(created),
        ipAddress: ipAddress ?? null,
      });
    }

    return this.mapRow(created);
  }

  async update(id: string, dto: UpdateSupplierDto, actorUserId?: string, ipAddress?: string) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    const oldSnap = this.supplierSnap(existing);

    if (dto.nit !== undefined) {
      const nit = normalizeNit(dto.nit);
      const dup = await this.prisma.supplier.findFirst({
        where: { nit, NOT: { id } },
      });
      if (dup) {
        throw new ConflictException('Ya existe un proveedor con ese NIT');
      }
    }

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.nit !== undefined && { nit: normalizeNit(dto.nit) }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.contactName !== undefined && {
          contactName: dto.contactName?.trim() || null,
        }),
        ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city?.trim() || null }),
      },
      include: { _count: { select: { purchases: true } } },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'supplier.update',
        module: 'suppliers',
        entityId: id,
        entityType: 'Supplier',
        oldData: oldSnap,
        newData: this.supplierSnap(updated),
        ipAddress: ipAddress ?? null,
      });
    }

    return this.mapRow(updated);
  }

  async softDelete(id: string) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true as const };
  }
}
