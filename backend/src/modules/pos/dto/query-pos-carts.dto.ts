import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Max, Min } from 'class-validator';
import { SaleStatus } from '@prisma/client';

export class QueryPosCartsDto {
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
    return Number.isFinite(n) && n >= 1 ? n : 20;
  })
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;
}
