import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateInvoiceNumberingDto {
  @IsOptional()
  @IsString()
  @MaxLength(12)
  prefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  resolutionNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  endNumber?: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
