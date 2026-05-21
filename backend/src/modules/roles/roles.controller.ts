import { Body, Controller, Get, Ip, Param, ParseUUIDPipe, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesService } from './roles.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('roles.view')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('roles.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id/permissions')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('roles.manage')
  updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRolePermissionsDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.rolesService.updatePermissions(id, dto, req.user.id, ip);
  }
}
