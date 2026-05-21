import { Transform } from 'class-transformer';
import { DocumentType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class CreateCustomerDto {
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsString()
  @MinLength(3)
  @MaxLength(32)
  documentNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;
}
