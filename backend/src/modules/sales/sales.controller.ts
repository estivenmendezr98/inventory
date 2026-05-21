import {
  Controller,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { extractClientIp } from '../../common/utils/request-ip.util';
import { AuthGuard } from '@nestjs/passport';
import { SalesService } from './sales.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QuerySalesDto } from './dto/query-sales.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sales.view')
  findAll(@Query() query: QuerySalesDto) {
    return this.salesService.findAll(query);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sales.cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.salesService.cancel(id, req.user.id, extractClientIp(req) ?? ip);
  }

  @Post(':id/refund')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sales.refund')
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.salesService.refund(id, req.user.id, extractClientIp(req) ?? ip);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sales.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sales.create')
  create(
    @Body() dto: CreateSaleDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.salesService.create(dto, req.user.id, extractClientIp(req) ?? ip);
  }
}
