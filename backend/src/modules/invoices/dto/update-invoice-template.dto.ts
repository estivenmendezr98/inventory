import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { TicketOrientation, TicketPageSize } from '../invoice-template.config';

export class UpdateInvoiceTemplateDto {
  @IsOptional()
  @IsIn(['80mm', '58mm', 'A4', 'LETTER', 'LEGAL', 'A5'])
  pageSize?: TicketPageSize;

  @IsOptional()
  @IsIn(['portrait', 'landscape'])
  orientation?: TicketOrientation;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(40)
  marginTopMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(40)
  marginRightMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(40)
  marginBottomMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(40)
  marginLeftMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(16)
  fontSizeTitle?: number;

  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(14)
  fontSizeBody?: number;

  @IsOptional()
  @IsNumber()
  @Min(6)
  @Max(12)
  fontSizeItems?: number;

  @IsOptional()
  @IsNumber()
  @Min(6)
  @Max(11)
  fontSizeFooter?: number;

  @IsOptional()
  @IsString()
  headerBackgroundColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @IsOptional()
  @IsBoolean()
  showItemSku?: boolean;

  @IsOptional()
  @IsBoolean()
  showSubtotal?: boolean;

  @IsOptional()
  @IsBoolean()
  showTax?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  footerText?: string;

  @IsOptional()
  @IsBoolean()
  appendFooterNote?: boolean;

  @IsOptional()
  @IsBoolean()
  showSimplifiedRegimeLine?: boolean;

  @IsOptional()
  @IsBoolean()
  previewBeforePrint?: boolean;

  @IsOptional()
  @IsString()
  printerHint?: string;

  @IsOptional()
  @IsBoolean()
  openCashDrawer?: boolean;
}
