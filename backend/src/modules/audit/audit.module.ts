import { Global, Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditExportService } from './audit-export.service';
import { AuthModule } from '../../auth/auth.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService, AuditExportService, PermissionsGuard],
  exports: [AuditService],
})
export class AuditModule {}
