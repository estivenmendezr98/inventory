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
import { CustomersService } from './customers.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('customers.view')
  findAll(@Query() query: QueryCustomersDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('customers.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('customers.create')
  create(
    @Body() dto: CreateCustomerDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.customersService.create(dto, req.user.id, extractClientIp(req) ?? ip);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('customers.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.customersService.update(id, dto, req.user.id, extractClientIp(req) ?? ip);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('customers.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.softDelete(id);
  }
}
