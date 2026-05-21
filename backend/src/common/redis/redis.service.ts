import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

function parsePort(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw || String(fallback), 10);
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : fallback;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('REDIS_HOST')?.trim();
    if (!host) {
      this.logger.log('REDIS_HOST no definido: Redis omitido (skipped).');
      return;
    }
    const port = parsePort(this.config.get<string>('REDIS_PORT'), 6379);
    const password = this.config.get<string>('REDIS_PASSWORD')?.trim();
    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 4_000,
      commandTimeout: 4_000,
    });
  }

  async ping(): Promise<'ok' | 'error' | 'skipped'> {
    if (!this.client) return 'skipped';
    try {
      if (this.client.status === 'wait') {
        await this.client.connect();
      }
      const r = await this.client.ping();
      return r === 'PONG' ? 'ok' : 'error';
    } catch (e) {
      this.logger.warn(`Redis ping: ${e instanceof Error ? e.message : e}`);
      return 'error';
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }
}
