import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AuditService } from '../audit/audit.service';
import { snapshotParty } from '../audit/audit-snapshots.util';

function normalizeDoc(num: string): string {
  return num.replace(/\s+/g, '').trim();
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private mapRow(c: {
    id: string;
    documentType: string;
    documentNumber: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { sales: number };
  }) {
    return {
      id: c.id,
      documentType: c.documentType,
      documentNumber: c.documentNumber,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      isActive: c.isActive,
      saleCount: c._count?.sales ?? 0,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async findAll(query: QueryCustomersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};
    if (!query.includeInactive) {
      where.isActive = true;
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { documentNumber: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { sales: true } } },
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
    const c = await this.prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { sales: true } } },
    });
    if (!c) throw new NotFoundException('Cliente no encontrado');
    return this.mapRow(c);
  }

  async create(dto: CreateCustomerDto, actorUserId?: string, ipAddress?: string) {
    const documentNumber = normalizeDoc(dto.documentNumber);
    const dup = await this.prisma.customer.findUnique({
      where: { documentNumber },
    });
    if (dup) {
      throw new ConflictException('Ya existe un cliente con ese número de documento');
    }

    const created = await this.prisma.customer.create({
      data: {
        documentType: dto.documentType,
        documentNumber,
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
      },
      include: { _count: { select: { sales: true } } },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'customer.create',
        module: 'customers',
        entityId: created.id,
        entityType: 'Customer',
        newData: snapshotParty({
          ...created,
          documentType: created.documentType,
          documentNumber: created.documentNumber,
        }),
        ipAddress: ipAddress ?? null,
      });
    }

    return this.mapRow(created);
  }

  async update(id: string, dto: UpdateCustomerDto, actorUserId?: string, ipAddress?: string) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cliente no encontrado');
    const oldSnap = snapshotParty(existing);

    if (dto.documentNumber !== undefined) {
      const documentNumber = normalizeDoc(dto.documentNumber);
      const dup = await this.prisma.customer.findFirst({
        where: { documentNumber, NOT: { id } },
      });
      if (dup) {
        throw new ConflictException('Ya existe un cliente con ese número de documento');
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.documentType !== undefined && { documentType: dto.documentType }),
        ...(dto.documentNumber !== undefined && {
          documentNumber: normalizeDoc(dto.documentNumber),
        }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.email !== undefined && {
          email: dto.email === null ? null : dto.email?.trim() || null,
        }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city?.trim() || null }),
      },
      include: { _count: { select: { sales: true } } },
    });

    if (actorUserId) {
      await this.audit.record({
        userId: actorUserId,
        action: 'customer.update',
        module: 'customers',
        entityId: id,
        entityType: 'Customer',
        oldData: oldSnap,
        newData: snapshotParty(updated),
        ipAddress: ipAddress ?? null,
      });
    }

    return this.mapRow(updated);
  }

  async softDelete(id: string) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cliente no encontrado');
    await this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true as const };
  }
}
