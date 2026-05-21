import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { SalesModule } from '../sales/sales.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SalesModule,
    InvoicesModule,
    InventoryModule,
    CashRegisterModule,
  ],
  controllers: [PosController],
  providers: [PosService, PermissionsGuard],
})
export class PosModule {}
