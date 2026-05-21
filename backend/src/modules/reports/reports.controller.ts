import { Controller, Get, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ReportsService } from './reports.service';
import { QueryReportsRangeDto } from './dto/query-reports-range.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('reports.view')
  sales(@Query() query: QueryReportsRangeDto) {
    return this.reportsService.salesByRange(query);
  }

  @Get('purchases')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('reports.view')
  purchases(@Query() query: QueryReportsRangeDto) {
    return this.reportsService.purchasesByRange(query);
  }

  @Get('inventory-value')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('reports.view')
  inventoryValue(@Query() query: QueryReportsRangeDto) {
    return this.reportsService.inventoryValue(query);
  }

  @Get('export/sales')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('reports.export')
  async exportSales(@Query() query: QueryReportsRangeDto) {
    const { filename, body } = await this.reportsService.exportSalesCsv(query);
    const buffer = Buffer.from(`\uFEFF${body}`, 'utf-8');
    return new StreamableFile(buffer, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
    });
  }
}
