import { IsInt, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class AdjustInventoryDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(0)
  newQuantity!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
