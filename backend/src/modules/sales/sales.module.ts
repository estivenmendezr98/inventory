import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesAdjustmentsController } from './sales-adjustments.controller';
import { SalesService } from './sales.service';
import { AuthModule } from '../../auth/auth.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { InvoicesModule } from '../invoices/invoices.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    InvoicesModule,
    InventoryModule,
    CashRegisterModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [SalesController, SalesAdjustmentsController],
  providers: [SalesService, PermissionsGuard],
  exports: [SalesService],
})
export class SalesModule {}
