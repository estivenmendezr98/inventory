import { Controller, Get, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KardexService } from './kardex.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryKardexDto } from './dto/query-kardex.dto';

@Controller('kardex')
export class KardexController {
  constructor(private readonly kardexService: KardexService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('kardex.view')
  findAll(@Query() query: QueryKardexDto) {
    return this.kardexService.findAll(query);
  }

  @Get('export')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('kardex.view')
  async export(@Query() query: QueryKardexDto) {
    const { filename, body } = await this.kardexService.exportCsv(query);
    const buffer = Buffer.from(`\uFEFF${body}`, 'utf-8');
    return new StreamableFile(buffer, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
    });
  }
}
