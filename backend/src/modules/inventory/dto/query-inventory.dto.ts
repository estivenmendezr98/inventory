import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryInventoryDto {
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
  search?: string;

  /** Solo productos con stock por debajo del mínimo configurado */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  lowStockOnly?: boolean;
}
