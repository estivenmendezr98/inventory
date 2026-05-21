import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { MinioStorageService } from '../../common/storage/minio-storage.service';

type ServicesStatus = {
  database: 'ok' | 'error';
  api: 'ok';
  redis: 'ok' | 'error' | 'skipped';
  minio: 'ok' | 'error' | 'skipped';
};

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly minio: MinioStorageService,
  ) {}

  /** Liveness: proceso vivo (sin tocar BD). */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Readiness: **503** si PostgreSQL no responde (balanceadores / orquestadores). */
  @Get('ready')
  async ready() {
    const services = await this.buildServices();
    if (services.database !== 'ok') {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        services,
      });
    }
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  /**
   * Estado legible para humanos y paneles: **siempre HTTP 200** con `status` ok | degraded.
   * Para automatismo estricto usar `GET /api/health/ready`.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    const services = await this.buildServices();
    const degraded =
      services.database !== 'ok' || services.redis === 'error' || services.minio === 'error';
    return {
      status: degraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      services,
      version: '1.0.0',
    };
  }

  private async buildServices(): Promise<ServicesStatus> {
    const [database, redis, minio] = await Promise.all([
      this.checkDatabaseFlag(),
      this.redis.ping(),
      this.minio.ping(),
    ]);
    return {
      database,
      api: 'ok',
      redis,
      minio,
    };
  }

  private async checkDatabaseFlag(): Promise<'ok' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
