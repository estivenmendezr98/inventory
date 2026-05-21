import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class SaleAdjustmentChangeDto {
  @IsIn(['ADD', 'REMOVE'])
  action!: 'ADD' | 'REMOVE';

  @IsOptional()
  @IsUUID()
  saleItemId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  discount?: number;
}

export class SaleAdjustmentPaymentDeltaDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  change?: number;
}

export class CreateSaleAdjustmentDto {
  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleAdjustmentChangeDto)
  changes!: SaleAdjustmentChangeDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SaleAdjustmentPaymentDeltaDto)
  paymentDelta?: SaleAdjustmentPaymentDeltaDto;
}
