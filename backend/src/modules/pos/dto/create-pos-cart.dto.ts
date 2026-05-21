import { IsOptional, IsUUID } from 'class-validator';

export class CreatePosCartDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
