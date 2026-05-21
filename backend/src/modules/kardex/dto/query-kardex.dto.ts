import { KardexType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryKardexDto {
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
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsUUID()
  productId?: string;

  /** Inicio del rango (inclusive), ISO 8601 o fecha YYYY-MM-DD */
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsDateString()
  from?: string;

  /** Fin del rango (inclusive), ISO 8601 o fecha YYYY-MM-DD */
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(KardexType)
  type?: KardexType;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsUUID()
  referenceId?: string;
}
