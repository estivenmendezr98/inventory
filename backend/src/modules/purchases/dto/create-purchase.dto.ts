import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseLineInputDto {
  @IsUUID()
  productId!: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  /** Unidad de compra; si no se envía, se usa la unidad base del producto. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  purchaseUnitId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate!: number;
}

export class CreatePurchaseDto {
  @IsUUID()
  supplierId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineInputDto)
  items!: PurchaseLineInputDto[];
}
