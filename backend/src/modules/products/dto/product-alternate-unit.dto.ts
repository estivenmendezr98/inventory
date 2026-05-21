import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ProductAlternateUnitDto {
  @IsString()
  @MaxLength(64)
  unitOfMeasureId!: string;

  /** Unidades base por cada 1 unidad alterna (ej. 1 caja = 12 und → 12). */
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  factorToBase!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  label?: string;
}

export class ProductAlternateUnitsDto {
  @Type(() => ProductAlternateUnitDto)
  units!: ProductAlternateUnitDto[];
}
