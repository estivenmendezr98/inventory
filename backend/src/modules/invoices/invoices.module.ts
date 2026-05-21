import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceArtifactsService } from './invoice-artifacts.service';
import { AuthModule } from '../../auth/auth.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TicketIssuerService } from './ticket-issuer.service';
import { InvoiceTemplateConfigService } from './invoice-template-config.service';
import { InvoiceEmailConfigService } from './invoice-email-config.service';
import { InvoiceMailService } from './invoice-mail.service';

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoiceArtifactsService,
    TicketIssuerService,
    InvoiceTemplateConfigService,
    InvoiceEmailConfigService,
    InvoiceMailService,
    PermissionsGuard,
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
