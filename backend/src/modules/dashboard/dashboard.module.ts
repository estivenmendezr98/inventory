import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../../auth/auth.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService, PermissionsGuard],
})
export class DashboardModule {}
