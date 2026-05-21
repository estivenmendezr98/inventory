import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Body,
  Query,
  StreamableFile,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { extractClientIp } from '../../common/utils/request-ip.util';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { UpdateInvoiceNumberingDto } from './dto/update-invoice-numbering.dto';
import { safeInvoiceAttachmentName } from './invoice-file.utils';
import { UpdateInvoiceTemplateDto } from './dto/update-invoice-template.dto';
import {
  UpdateInvoiceEmailDto,
  SendInvoiceEmailDto,
  TestInvoiceEmailDto,
} from './dto/update-invoice-email.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('eligible-sales')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.generate', 'invoices.create')
  eligibleSales() {
    return this.invoicesService.eligibleSales();
  }

  @Get('numbering')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config')
  listNumbering() {
    return this.invoicesService.listNumbering();
  }

  @Put('numbering/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config')
  updateNumbering(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceNumberingDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.invoicesService.updateNumbering(
      id,
      dto,
      req.user.id,
      extractClientIp(req) ?? ip,
    );
  }

  /** Rutas estáticas / multi-segmento antes de `:id` para evitar conflictos con el router. */
  @Post('from-sale/:saleId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.generate', 'invoices.create')
  createFromSale(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.invoicesService.createFromSale(
      saleId,
      req.user.id,
      extractClientIp(req) ?? ip,
    );
  }

  @Get('template-config')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config')
  getTemplateConfig() {
    return this.invoicesService.getTemplateConfig();
  }

  @Put('template-config')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config')
  updateTemplateConfig(@Body() dto: UpdateInvoiceTemplateDto) {
    return this.invoicesService.updateTemplateConfig(dto);
  }

  @Get('template-config/preview.pdf')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config')
  async previewTemplatePdf(): Promise<StreamableFile> {
    const buf = await this.invoicesService.previewTemplatePdf();
    return new StreamableFile(buf, {
      type: 'application/pdf',
      disposition: 'inline; filename="factura-vista-previa.pdf"',
    });
  }

  @Get('email-config')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config')
  getEmailConfig() {
    return this.invoicesService.getEmailConfig();
  }

  @Put('email-config')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config')
  updateEmailConfig(@Body() dto: UpdateInvoiceEmailDto) {
    return this.invoicesService.updateEmailConfig(dto);
  }

  @Post('email-config/test')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config')
  testEmailConfig(@Body() dto: TestInvoiceEmailDto) {
    return this.invoicesService.testEmailConfig(dto.to);
  }

  @Post(':id/send-email')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.generate', 'invoices.create')
  sendInvoiceEmail(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SendInvoiceEmailDto) {
    return this.invoicesService.sendInvoiceEmail(id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.invoicesService.cancel(id, req.user.id, extractClientIp(req) ?? ip);
  }

  @Post(':id/regenerate-artifacts')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.generate', 'invoices.create')
  regenerateArtifacts(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.regenerateArtifacts(id);
  }

  @Get('thermal-receipt/sample')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.config', 'invoices.reprint')
  thermalReceiptSample() {
    return this.invoicesService.getThermalReceiptSample();
  }

  @Get(':id/thermal-receipt')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.view', 'invoices.reprint')
  thermalReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.getThermalReceipt(id);
  }

  @Get(':id/files/pdf')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.view')
  async downloadPdf(@Param('id', ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const { stream, contentType, filename } = await this.invoicesService.getInvoiceFileStream(id, 'pdf');
    const safe = safeInvoiceAttachmentName(filename);
    return new StreamableFile(stream, {
      type: contentType,
      disposition: `attachment; filename="${safe}"`,
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.view')
  findAll(@Query() query: QueryInvoicesDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('invoices.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }
}
