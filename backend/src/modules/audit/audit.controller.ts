import { Controller, Get, Param, ParseUUIDPipe, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';
import { AuditExportService } from './audit-export.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { ExportAuditLogsDto } from './dto/export-audit-logs.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditExportService: AuditExportService,
  ) {}

  @Get('export')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('audit.export')
  async exportLogs(
    @Query() query: ExportAuditLogsDto,
    @CurrentUser() user: { id: string; email?: string; firstName?: string; lastName?: string },
  ) {
    const { filename, buffer, mime } = await this.auditExportService.export(query, {
      id: user?.id,
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
    });
    return new StreamableFile(buffer, {
      type: mime,
      disposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
    });
  }

  @Get('meta')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('audit.view')
  getMeta() {
    return this.auditService.getMeta();
  }

  @Get('logs/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('audit.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }

  /** Listado paginado (ruta explícita; evita proxies que traten mal `GET /audit` sin segmento). */
  @Get('logs')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('audit.view')
  findLogs(@Query() query: QueryAuditLogsDto) {
    return this.auditService.findPage(query);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('audit.view')
  findAll(@Query() query: QueryAuditLogsDto) {
    return this.auditService.findPage(query);
  }
}
