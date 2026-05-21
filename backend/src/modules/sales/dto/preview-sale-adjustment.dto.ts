import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, ValidateNested } from 'class-validator';
import {
  SaleAdjustmentChangeDto,
  SaleAdjustmentPaymentDeltaDto,
} from './create-sale-adjustment.dto';

/** Vista previa de ajuste (sin motivo obligatorio). */
export class PreviewSaleAdjustmentDto {
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
