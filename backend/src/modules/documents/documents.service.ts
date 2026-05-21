import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { ensureDocumentsDir } from './documents.paths';
import { unlink } from 'node:fs/promises';
import * as path from 'node:path';
import { access, constants } from 'node:fs/promises';
import type { Express } from 'express';
import { AuditService } from '../audit/audit.service';

function sanitizeDisplayName(name: string): string {
  const base = path.basename(name || '').replace(/[\x00-\x1f<>:"/\\|?*]/g, '_');
  return (base || 'archivo').slice(0, 200);
}

function fileTypeLabel(mimetype: string, originalName: string): string {
  const ext = path.extname(originalName || '').replace('.', '').toLowerCase();
  if (ext) return ext.slice(0, 32);
  const sub = mimetype?.split('/')?.[1];
  return (sub || 'file').slice(0, 32);
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private fullPathOnDisk(storedFilename: string): string {
    const dir = path.resolve(ensureDocumentsDir());
    const base = path.basename(storedFilename);
    const full = path.resolve(dir, base);
    const rel = path.relative(dir, full);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new BadRequestException('Ruta de archivo inválida');
    }
    return full;
  }

  async findAll(query: QueryDocumentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: {
      OR?: { name: { contains: string; mode: 'insensitive' } }[];
      module?: string;
    } = {};

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [{ name: { contains: s, mode: 'insensitive' } }];
    }
    if (query.module?.trim()) {
      where.module = query.module.trim();
    }

    const [total, rows] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        mimeType: r.mimeType,
        size: r.size,
        module: r.module,
        entityId: r.entityId,
        createdAt: r.createdAt.toISOString(),
        uploadedBy: {
          id: r.user.id,
          email: r.user.email,
          firstName: r.user.firstName,
          lastName: r.user.lastName,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async registerAfterUpload(
    id: string,
    file: Express.Multer.File,
    module: string,
    entityId: string | undefined,
    uploadedBy: string,
  ) {
    if (!file?.filename) {
      throw new BadRequestException('Archivo no recibido');
    }
    const displayName = sanitizeDisplayName(file.originalname || 'archivo');
    const typeLabel = fileTypeLabel(file.mimetype || '', file.originalname || '');

    try {
      const doc = await this.prisma.document.create({
        data: {
          id,
          name: displayName,
          type: typeLabel,
          path: file.filename,
          size: file.size,
          mimeType: file.mimetype || 'application/octet-stream',
          module,
          entityId: entityId ?? null,
          uploadedBy,
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });
      return {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        mimeType: doc.mimeType,
        size: doc.size,
        module: doc.module,
        entityId: doc.entityId,
        createdAt: doc.createdAt.toISOString(),
        uploadedBy: {
          id: doc.user.id,
          email: doc.user.email,
          firstName: doc.user.firstName,
          lastName: doc.user.lastName,
        },
      };
    } catch (err) {
      const full = this.fullPathOnDisk(file.filename);
      await unlink(full).catch(() => undefined);
      throw err;
    }
  }

  async resolveFileForDownload(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento no encontrado');
    }
    const full = this.fullPathOnDisk(doc.path);
    try {
      await access(full, constants.R_OK);
    } catch {
      throw new InternalServerErrorException('Archivo no disponible en disco');
    }
    return { doc, fullPath: full };
  }

  async remove(id: string, actorUserId: string, ipAddress?: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento no encontrado');
    }
    const full = this.fullPathOnDisk(doc.path);

    await this.audit.record({
      userId: actorUserId,
      action: 'document.delete',
      module: 'documents',
      entityId: id,
      entityType: 'Document',
      oldData: {
        name: doc.name,
        type: doc.type,
        module: doc.module,
        entityId: doc.entityId,
        mimeType: doc.mimeType,
        size: doc.size,
        path: doc.path,
        uploadedBy: doc.uploadedBy,
      },
      newData: null,
      ipAddress: ipAddress ?? null,
    });

    await this.prisma.document.delete({ where: { id } });
    await unlink(full).catch(() => undefined);
  }
}
