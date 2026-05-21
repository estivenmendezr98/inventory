import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { APP_SETTING_KEY_SET, APP_SETTING_KEYS_ORDER } from './settings.constants';
import {
  COMPANY_LOGO_BASENAME,
  COMPANY_LOGO_MAX_BYTES,
  COMPANY_LOGO_MIMES,
  COMPANY_LOGO_SETTING_KEY,
  MIME_TO_EXT,
} from './company-logo.constants';
import { ensureBrandingDir, resolveBrandingStorageDir } from './settings.paths';
import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import * as path from 'node:path';
import type { Express } from 'express';
import { AuditService } from '../audit/audit.service';
import { snapshotSettingsChanges } from '../audit/audit-snapshots.util';

export interface CompanyLogoMeta {
  filename: string;
  mimeType: string;
  updatedAt: string;
}

export interface BrandingInfo {
  hasLogo: boolean;
  updatedAt: string | null;
  mimeType: string | null;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getAll() {
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: [...APP_SETTING_KEYS_ORDER] } },
    });
    const byKey = new Map(rows.map((r) => [r.key, r]));

    const items = APP_SETTING_KEYS_ORDER.map((key) => {
      const row = byKey.get(key);
      return {
        key,
        value: row?.value ?? '',
        updatedAt: row?.updatedAt?.toISOString() ?? null,
      };
    });

    return {
      items,
      branding: await this.getBrandingInfo(),
      meta: {
        nodeEnv: process.env.NODE_ENV ?? 'development',
      },
    };
  }

  async getBrandingInfo(): Promise<BrandingInfo> {
    const meta = await this.readLogoMeta();
    return {
      hasLogo: !!meta,
      updatedAt: meta?.updatedAt ?? null,
      mimeType: meta?.mimeType ?? null,
    };
  }

  async update(dto: UpdateSettingsDto, actorUserId: string, ipAddress?: string) {
    for (const e of dto.entries) {
      if (!APP_SETTING_KEY_SET.has(e.key)) {
        throw new BadRequestException(`Clave no permitida: ${e.key}`);
      }
    }

    const keys = dto.entries.map((e) => e.key);
    const prevRows = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
    });
    const previous = new Map(prevRows.map((r) => [r.key, r.value]));

    for (const { key, value } of dto.entries) {
      await this.prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await this.audit.record({
      userId: actorUserId,
      action: 'settings.update',
      module: 'settings',
      entityType: 'AppSetting',
      newData: { changes: snapshotSettingsChanges(dto.entries, previous) },
      ipAddress: ipAddress ?? null,
    });

    return this.getAll();
  }

  async uploadCompanyLogo(
    file: Express.Multer.File,
    actorUserId: string,
    ipAddress?: string,
  ): Promise<BrandingInfo> {
    const mime = (file.mimetype || '').toLowerCase();
    if (!COMPANY_LOGO_MIMES.has(mime)) {
      throw new BadRequestException(
        'Formato no permitido. Use PNG, JPEG, WebP o SVG.',
      );
    }
    if (file.size > COMPANY_LOGO_MAX_BYTES) {
      throw new BadRequestException('El logo no puede superar 2 MB.');
    }

    const ext = MIME_TO_EXT[mime] ?? path.extname(file.originalname || '');
    if (!ext) {
      throw new BadRequestException('No se pudo determinar la extensión del archivo.');
    }

    ensureBrandingDir();
    this.removeLogoFiles();

    const filename = `${COMPANY_LOGO_BASENAME}${ext}`;
    const dest = path.join(resolveBrandingStorageDir(), filename);
    await import('node:fs/promises').then((fs) => fs.rename(file.path, dest));

    const updatedAt = new Date().toISOString();
    const meta: CompanyLogoMeta = { filename, mimeType: mime, updatedAt };
    await this.prisma.appSetting.upsert({
      where: { key: COMPANY_LOGO_SETTING_KEY },
      update: { value: JSON.stringify(meta) },
      create: { key: COMPANY_LOGO_SETTING_KEY, value: JSON.stringify(meta) },
    });

    await this.audit.record({
      userId: actorUserId,
      action: 'settings.logo_upload',
      module: 'settings',
      entityType: 'Branding',
      newData: { filename, mimeType: mime, sizeBytes: file.size },
      ipAddress: ipAddress ?? null,
    });

    return this.getBrandingInfo();
  }

  async deleteCompanyLogo(actorUserId: string, ipAddress?: string): Promise<BrandingInfo> {
    this.removeLogoFiles();
    await this.prisma.appSetting.deleteMany({
      where: { key: COMPANY_LOGO_SETTING_KEY },
    });

    await this.audit.record({
      userId: actorUserId,
      action: 'settings.logo_delete',
      module: 'settings',
      entityType: 'Branding',
      oldData: { hadLogo: true },
      newData: { hadLogo: false },
      ipAddress: ipAddress ?? null,
    });

    return this.getBrandingInfo();
  }

  async resolveLogoFile(): Promise<{ absolutePath: string; mimeType: string }> {
    const meta = await this.readLogoMeta();
    if (!meta) {
      throw new NotFoundException('No hay logo configurado');
    }
    const absolutePath = path.join(resolveBrandingStorageDir(), meta.filename);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Archivo de logo no encontrado');
    }
    return { absolutePath, mimeType: meta.mimeType };
  }

  private async readLogoMeta(): Promise<CompanyLogoMeta | null> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: COMPANY_LOGO_SETTING_KEY },
    });
    if (!row?.value?.trim()) return null;
    try {
      const parsed = JSON.parse(row.value) as CompanyLogoMeta;
      if (!parsed.filename || !parsed.mimeType) return null;
      return {
        filename: parsed.filename,
        mimeType: parsed.mimeType,
        updatedAt: parsed.updatedAt ?? row.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  private removeLogoFiles(): void {
    const dir = resolveBrandingStorageDir();
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      if (name.startsWith(COMPANY_LOGO_BASENAME)) {
        try {
          unlinkSync(path.join(dir, name));
        } catch {
          /* ignore */
        }
      }
    }
  }
}
