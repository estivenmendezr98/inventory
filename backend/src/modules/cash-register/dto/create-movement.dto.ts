import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CashMovementType } from '@prisma/client';

export class CreateMovementDto {
  @IsEnum(CashMovementType)
  type!: CashMovementType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
