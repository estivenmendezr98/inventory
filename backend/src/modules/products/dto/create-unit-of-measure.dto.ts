import { UnitCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Alta en tabla `units_of_measure` (catálogo persistido en BD). */
export class CreateUnitOfMeasureDto {
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Transform(({ value }) => String(value).trim())
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(16)
  @Transform(({ value }) => String(value).trim())
  symbol!: string;

  @IsEnum(UnitCategory)
  category!: UnitCategory;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  allowsDecimals?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  decimalPlaces?: number;
}
