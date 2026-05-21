import { Transform } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';

export class QueryRecentNotificationsDto {
  @IsOptional()
  @Transform(({ value }) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 1 ? n : 8;
  })
  @Min(1)
  @Max(20)
  limit?: number = 8;
}
