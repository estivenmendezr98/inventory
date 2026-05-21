import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('dashboard.view')
  async getSummary(@Req() req: { user: { id: string } }) {
    return this.dashboardService.getSummaryForUser(req.user.id);
  }
}
