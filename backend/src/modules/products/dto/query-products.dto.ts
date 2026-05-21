import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryProductsDto {
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
  @Max(500)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsUUID()
  categoryId?: string;

  /** Si es true, incluye productos inactivos (solo útil para administración). */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean = false;

  /** Excluye reservas de este carrito POS al calcular `availableStock` (máximo asignable al carrito). */
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsUUID()
  excludeCartId?: string;
}
