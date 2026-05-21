import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class QueryAuditLogsDto {
  @IsOptional()
  @Transform(({ value }) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  })
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 1 ? n : 50;
  })
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  module?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  action?: string;

  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  entityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  entityType?: string;

  /** Búsqueda libre: acción, módulo, entidad, IP, email o nombre de usuario. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  /** Fecha inicio inclusive (YYYY-MM-DD, zona Bogotá). */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  from?: string;

  /** Fecha fin inclusive (YYYY-MM-DD, zona Bogotá). */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  to?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: string;

  @IsOptional()
  @IsIn(['CREATE', 'UPDATE', 'DELETE', 'SYNC', 'OTHER'])
  operation?: string;
}
