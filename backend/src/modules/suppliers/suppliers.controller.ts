import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Ip,
  UseGuards,
} from '@nestjs/common';
import { extractClientIp } from '../../common/utils/request-ip.util';
import { AuthGuard } from '@nestjs/passport';
import { SuppliersService } from './suppliers.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get('options/active')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('suppliers.view')
  activeOptions() {
    return this.suppliersService.findActiveOptions();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('suppliers.view')
  findAll(@Query() query: QuerySuppliersDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('suppliers.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('suppliers.create')
  create(
    @Body() dto: CreateSupplierDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.suppliersService.create(dto, req.user.id, extractClientIp(req) ?? ip);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('suppliers.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.suppliersService.update(id, dto, req.user.id, extractClientIp(req) ?? ip);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('suppliers.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.softDelete(id);
  }
}
