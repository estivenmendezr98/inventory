import { Body, Controller, Ip, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { extractClientIp } from '../../common/utils/request-ip.util';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { SalesService } from './sales.service';
import { CreateSaleAdjustmentDto } from './dto/create-sale-adjustment.dto';
import { PreviewSaleAdjustmentDto } from './dto/preview-sale-adjustment.dto';

/** Ajustes post-venta (ruta dedicada; evita colisión con `sales/:id` en algunos despliegues). */
@Controller('sales-adjustments')
export class SalesAdjustmentsController {
  constructor(private readonly salesService: SalesService) {}

  @Post(':saleId/preview')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sales.adjust')
  preview(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: PreviewSaleAdjustmentDto,
  ) {
    return this.salesService.previewAdjustment(saleId, dto);
  }

  @Post(':saleId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sales.adjust')
  adjust(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: CreateSaleAdjustmentDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.salesService.adjust(
      saleId,
      dto,
      req.user.id,
      extractClientIp(req) ?? ip,
    );
  }
}
