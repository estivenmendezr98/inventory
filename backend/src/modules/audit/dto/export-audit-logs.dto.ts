import { IsIn } from 'class-validator';
import { QueryAuditLogsDto } from './query-audit-logs.dto';

export class ExportAuditLogsDto extends QueryAuditLogsDto {
  @IsIn(['csv', 'pdf'])
  format: 'csv' | 'pdf' = 'csv';
}
