import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { QueryRecentNotificationsDto } from './dto/query-recent-notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('notifications.view')
  findAll(@Req() req: { user: { id: string } }, @Query() query: QueryNotificationsDto) {
    return this.notificationsService.findAllForUser(req.user.id, query);
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('notifications.view')
  unreadCount(@Req() req: { user: { id: string } }) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Get('recent')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('notifications.view')
  recent(@Req() req: { user: { id: string } }, @Query() query: QueryRecentNotificationsDto) {
    return this.notificationsService.findRecentForUser(req.user.id, query.limit ?? 8);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('notifications.view')
  markRead(@Req() req: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }

  @Post('read-all')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('notifications.view')
  markAllRead(@Req() req: { user: { id: string } }) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Delete('read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('notifications.view')
  removeAllRead(@Req() req: { user: { id: string } }) {
    return this.notificationsService.removeAllRead(req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('notifications.view')
  remove(@Req() req: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(req.user.id, id);
  }
}
