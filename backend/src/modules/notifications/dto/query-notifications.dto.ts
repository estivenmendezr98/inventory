import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryNotificationsDto {
  @IsOptional()
  @Transform(({ value }) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  })
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 1 ? n : 30;
  })
  @Min(1)
  @Max(100)
  limit?: number = 30;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  module?: string;
}
