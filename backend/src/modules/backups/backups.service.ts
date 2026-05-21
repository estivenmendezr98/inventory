import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import * as path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { AuditService } from '../audit/audit.service';

const BACKUP_FILENAME_RE =
  /^inventory-app-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.sql$/;

export interface BackupListItem {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

@Injectable()
export class BackupsService {
  constructor(
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  private backupDir(): string {
    const raw =
      this.config.get<string>('BACKUP_STORAGE_PATH') || 'storage/backups';
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }

  private sanitizeDatabaseUrlForPgDump(databaseUrl: string): string {
    const u = new URL(databaseUrl);
    u.searchParams.delete('schema');
    u.searchParams.delete('connect_timeout');
    return u.toString();
  }

  /** Ruta al ejecutable pg_dump (env PG_DUMP_PATH o rutas típicas en Windows). */
  private pgDumpExecutable(): string {
    const fromEnv = (
      this.config.get<string>('PG_DUMP_PATH') ||
      process.env.PG_DUMP_PATH ||
      ''
    ).trim();
    if (fromEnv) {
      return fromEnv.replace(/^["']|["']$/g, '');
    }

    if (process.platform === 'win32') {
      const versions = ['18', '17', '16', '15', '14'];
      const roots = [
        process.env.ProgramFiles || 'C:\\Program Files',
        process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
      ];
      for (const root of roots) {
        for (const v of versions) {
          const candidate = path.join(root, 'PostgreSQL', v, 'bin', 'pg_dump.exe');
          if (existsSync(candidate)) return candidate;
        }
      }
    }

    return 'pg_dump';
  }

  private pgDumpMissingMessage(): string {
    return [
      'No se encontró pg_dump.',
      'Windows: instala PostgreSQL (incluye pg_dump) o define PG_DUMP_PATH con la ruta completa a pg_dump.exe,',
      'por ejemplo PG_DUMP_PATH="C:\\\\Program Files\\\\PostgreSQL\\\\17\\\\bin\\\\pg_dump.exe".',
      'Docker: reconstruye la imagen del backend (ya incluye postgresql-client).',
    ].join(' ');
  }

  assertSafeBackupFilename(filename: string): void {
    const base = path.basename(filename);
    if (base !== filename || !BACKUP_FILENAME_RE.test(base)) {
      throw new BadRequestException('Nombre de archivo no permitido');
    }
  }

  resolveExistingBackupPath(filename: string): string {
    this.assertSafeBackupFilename(filename);
    const dir = path.resolve(this.backupDir());
    const full = path.resolve(dir, filename);
    const rel = path.relative(dir, full);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new BadRequestException('Ruta inválida');
    }
    return full;
  }

  async list(): Promise<BackupListItem[]> {
    const dir = this.backupDir();
    const resolvedDir = path.resolve(dir);
    try {
      const existing = await stat(resolvedDir).catch(() => null);
      if (existing && !existing.isDirectory()) {
        throw new InternalServerErrorException(
          `BACKUP_STORAGE_PATH no es un directorio: ${resolvedDir}`,
        );
      }
      await mkdir(resolvedDir, { recursive: true });
    } catch (e) {
      if (e instanceof InternalServerErrorException) throw e;
      throw new InternalServerErrorException(
        `No se pudo usar el directorio de respaldos (${resolvedDir}): ${(e as Error).message}`,
      );
    }
    const names = await readdir(resolvedDir);
    const items: BackupListItem[] = [];
    for (const name of names) {
      if (!BACKUP_FILENAME_RE.test(name)) continue;
      const st = await stat(path.join(resolvedDir, name));
      if (!st.isFile()) continue;
      items.push({
        filename: name,
        sizeBytes: st.size,
        createdAt: st.mtime.toISOString(),
      });
    }
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return items;
  }

  async createDatabaseBackup(
    actorUserId: string,
    ipAddress?: string,
  ): Promise<BackupListItem> {
    const databaseUrl = this.config.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new InternalServerErrorException('DATABASE_URL no configurada');
    }
    const dir = this.backupDir();
    const resolvedDir = path.resolve(dir);
    await mkdir(resolvedDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `inventory-app-${stamp}.sql`;
    const outPath = path.join(resolvedDir, filename);
    const dbUrl = this.sanitizeDatabaseUrlForPgDump(databaseUrl);
    const pgDump = this.pgDumpExecutable();

    const child = spawn(pgDump, ['--no-owner', '--clean', `--dbname=${dbUrl}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const ws = createWriteStream(outPath);
    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    try {
      await Promise.all([
        pipeline(child.stdout!, ws),
        once(child, 'close'),
      ]);
    } catch (err) {
      await unlink(outPath).catch(() => undefined);
      const e = err as NodeJS.ErrnoException;
      if (e?.code === 'ENOENT') {
        throw new InternalServerErrorException(this.pgDumpMissingMessage());
      }
      throw err;
    }
    const code = child.exitCode ?? 1;
    if (code !== 0) {
      await unlink(outPath).catch(() => undefined);
      throw new InternalServerErrorException(
        stderr.trim() || `pg_dump terminó con código ${code}`,
      );
    }

    const st = await stat(outPath);
    const item = {
      filename,
      sizeBytes: st.size,
      createdAt: st.mtime.toISOString(),
    };

    await this.audit.record({
      userId: actorUserId,
      action: 'backup.create',
      module: 'backups',
      entityId: filename,
      entityType: 'DatabaseBackup',
      newData: item,
      ipAddress: ipAddress ?? null,
    });

    return item;
  }

  async remove(filename: string, actorUserId: string, ipAddress?: string): Promise<void> {
    const full = this.resolveExistingBackupPath(filename);
    let sizeBytes: number | null = null;
    try {
      const st = await stat(full);
      sizeBytes = st.size;
    } catch {
      /* omit */
    }

    await this.audit.record({
      userId: actorUserId,
      action: 'backup.delete',
      module: 'backups',
      entityId: filename,
      entityType: 'DatabaseBackup',
      oldData: { filename, sizeBytes },
      newData: null,
      ipAddress: ipAddress ?? null,
    });

    try {
      await unlink(full);
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e?.code === 'ENOENT') {
        throw new NotFoundException('Respaldo no encontrado');
      }
      throw err;
    }
  }
}
