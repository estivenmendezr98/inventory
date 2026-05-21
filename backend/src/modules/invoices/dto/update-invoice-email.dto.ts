import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateInvoiceEmailDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  /** Si se omite o viene vacío, se conserva la contraseña guardada. */
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @IsOptional()
  @IsString()
  fromName?: string;

  @IsOptional()
  @ValidateIf((o) => typeof o.fromEmail === 'string' && o.fromEmail.trim().length > 0)
  @IsEmail()
  fromEmail?: string;

  @IsOptional()
  @IsString()
  defaultSubject?: string;

  @IsOptional()
  @IsString()
  defaultBody?: string;

  @IsOptional()
  @IsBoolean()
  attachPdf?: boolean;

  @IsOptional()
  @IsBoolean()
  attachXml?: boolean;

  @IsOptional()
  @IsString()
  replyTo?: string;

  /** Solo lectura en GET; el frontend puede reenviarlos — se ignoran al guardar. */
  @IsOptional()
  @IsBoolean()
  smtpPasswordSet?: boolean;

  @IsOptional()
  @IsBoolean()
  configured?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issues?: string[];
}

export class SendInvoiceEmailDto {
  @IsEmail()
  to!: string;

  @IsOptional()
  @IsEmail()
  cc?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class TestInvoiceEmailDto {
  @IsEmail()
  to!: string;
}
