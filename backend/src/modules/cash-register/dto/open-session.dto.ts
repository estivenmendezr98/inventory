import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class OpenSessionDto {
  @IsUUID()
  cashRegisterId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingAmount!: number;
}
