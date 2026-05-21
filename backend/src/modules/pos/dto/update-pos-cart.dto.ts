import { Type } from 'class-transformer';
import { Allow, IsArray, IsOptional, IsUUID, ValidateIf, ValidateNested } from 'class-validator';
import { SaleLineInputDto } from '../../sales/dto/create-sale.dto';

export class UpdatePosCartDto {
  @IsOptional()
  @Allow()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsUUID()
  customerId?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleLineInputDto)
  items!: SaleLineInputDto[];
}
