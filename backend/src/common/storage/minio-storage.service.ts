import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'node:stream';

function parseMinioEndpoint(
  raw: string,
  defaultPort: number,
): { host: string; port: number } {
  let s = raw.trim();
  if (s.startsWith('http://')) s = s.slice(7);
  if (s.startsWith('https://')) s = s.slice(8);
  const slash = s.indexOf('/');
  if (slash >= 0) s = s.slice(0, slash);
  const colon = s.lastIndexOf(':');
  if (colon > 0) {
    const host = s.slice(0, colon);
    const p = parseInt(s.slice(colon + 1), 10);
    if (Number.isFinite(p) && p > 0 && p < 65536) {
      return { host, port: p };
    }
  }
  return { host: s, port: defaultPort };
}

@Injectable()
export class MinioStorageService implements OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private client: Minio.Client | null = null;
  private bucket = '';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const rawEndpoint = this.config.get<string>('MINIO_ENDPOINT')?.trim();
    if (!rawEndpoint) {
      this.logger.log('MINIO_ENDPOINT no definido: MinIO omitido (skipped).');
      return;
    }
    const defaultPort = Math.min(
      65535,
      Math.max(1, parseInt(this.config.get<string>('MINIO_PORT') || '9000', 10) || 9000),
    );
    const { host, port } = parseMinioEndpoint(rawEndpoint, defaultPort);
    if (!host) {
      this.logger.warn('MINIO_ENDPOINT inválido: MinIO omitido.');
      return;
    }

    const accessKey = this.config.get<string>('MINIO_ROOT_USER')?.trim() || '';
    const secretKey = this.config.get<string>('MINIO_ROOT_PASSWORD')?.trim() || '';
    this.bucket = this.config.get<string>('MINIO_BUCKET')?.trim() || 'inventory-documents';

    let cli: Minio.Client;
    try {
      cli = new Minio.Client({
        endPoint: host,
        port,
        useSSL: this.config.get<string>('MINIO_USE_SSL') === 'true',
        accessKey,
        secretKey,
      });
      const exists = await cli.bucketExists(this.bucket);
      if (!exists) {
        await cli.makeBucket(this.bucket, '');
      }
      this.client = cli;
    } catch (e) {
      this.logger.warn(
        `MinIO no disponible al iniciar: ${e instanceof Error ? e.message : e}. Facturas usarán solo disco local.`,
      );
      this.client = null;
    }
  }

  isEnabled(): boolean {
    return !!this.client;
  }

  async ping(): Promise<'ok' | 'error' | 'skipped'> {
    if (!this.client) return 'skipped';
    try {
      await this.client.bucketExists(this.bucket);
      return 'ok';
    } catch (e) {
      this.logger.warn(`MinIO ping: ${e instanceof Error ? e.message : e}`);
      return 'error';
    }
  }

  objectKey(invoiceId: string, ext: 'pdf' | 'xml'): string {
    return `invoices/${invoiceId}.${ext}`;
  }

  async putBuffer(key: string, body: Buffer, contentType: string): Promise<void> {
    if (!this.client) throw new Error('MinIO no configurado');
    await this.client.putObject(this.bucket, key, body, body.length, {
      'Content-Type': contentType,
    });
  }

  async getObjectStream(key: string): Promise<Readable> {
    if (!this.client) throw new Error('MinIO no configurado');
    return await this.client.getObject(this.bucket, key);
  }
}
