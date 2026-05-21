import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ProductAlternateUnitDto } from './product-alternate-unit.dto';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku!: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** Unidad base obligatoria (stock y mínimos siempre en esta unidad). */
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  unitOfMeasureId!: string;

  /** Unidades de compra/venta adicionales con factor a la base. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ProductAlternateUnitDto)
  alternateUnits?: ProductAlternateUnitDto[];

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : String(value).trim()))
  @IsString()
  @MaxLength(255)
  measureDetail?: string;

  /** Ej: 30 (cada tubo tiene 30 cm). Requiere `contentUnitId`. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : Number(value),
  )
  contentPerUnit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  contentUnitId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => Number(value))
  costPrice!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => Number(value))
  salePrice!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value === undefined || value === '' ? 0 : Number(value)))
  taxRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Transform(({ value }) => (value === undefined || value === '' ? 0 : Number(value)))
  minStock?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Transform(({ value }) => (value === undefined || value === '' ? 0 : Number(value)))
  maxStock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;
}
