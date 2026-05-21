import { Body, Controller, Get, Ip, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('inventory.view')
  findAll(@Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Post('adjust')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('inventory.adjust')
  adjust(
    @Body() dto: AdjustInventoryDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.inventoryService.adjust(dto, req.user.id, ip);
  }
}
