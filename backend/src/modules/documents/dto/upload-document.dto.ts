import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9._-]+$/i, {
    message: 'module solo admite letras, números, punto, guión y guión bajo',
  })
  module!: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsUUID()
  entityId?: string;
}
