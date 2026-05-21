import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryUsersDto } from './dto/query-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('roles')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('users.create', 'users.update')
  listRoles() {
    return this.usersService.listRolesForForm();
  }

  @Post('sync-from-keycloak')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('settings.update')
  syncFromKeycloak(@Req() req: { user: { id: string } }, @Ip() ip: string) {
    return this.usersService.syncFromKeycloak(req.user.id, ip);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('users.view')
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('users.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('users.create')
  create(@Body() dto: CreateUserDto, @Req() req: { user: { id: string } }, @Ip() ip: string) {
    return this.usersService.create(dto, req.user.id, ip);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('users.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.usersService.update(id, dto, req.user.id, ip);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('users.delete')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.usersService.softDelete(id, req.user.id, ip);
  }
}
