import {
  Body,
  Controller,
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
import { PosService } from './pos.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryPosCartsDto } from './dto/query-pos-carts.dto';
import { CreatePosCartDto } from './dto/create-pos-cart.dto';
import { UpdatePosCartDto } from './dto/update-pos-cart.dto';
import { CheckoutPosCartDto } from './dto/checkout-pos-cart.dto';

@Controller('pos/carts')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('pos.access')
  findCarts(@Query() query: QueryPosCartsDto) {
    return this.posService.findCarts(query);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('pos.access')
  createCart(@Body() dto: CreatePosCartDto, @Req() req: { user: { id: string } }) {
    return this.posService.createCart(dto, req.user.id);
  }

  @Post(':id/checkout')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sales.create')
  checkout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckoutPosCartDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.posService.checkout(id, dto, req.user.id);
  }

  @Post(':id/suspend')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('pos.suspend_sale')
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.posService.suspend(id);
  }

  @Post(':id/resume')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('pos.resume_sale')
  resume(@Param('id', ParseUUIDPipe) id: string) {
    return this.posService.resume(id);
  }

  @Post(':id/discard')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('pos.access')
  discard(@Param('id', ParseUUIDPipe) id: string) {
    return this.posService.discard(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('pos.access')
  getCart(@Param('id', ParseUUIDPipe) id: string) {
    return this.posService.getCart(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('pos.access')
  updateCart(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosCartDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.posService.updateCart(id, dto, req.user.id);
  }
}
