import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AuthModule } from '../../auth/auth.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService, PermissionsGuard],
})
export class ReportsModule {}
