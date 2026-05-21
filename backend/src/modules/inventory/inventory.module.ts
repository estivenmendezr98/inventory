import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryStockService } from './inventory-stock.service';
import { AuthModule } from '../../auth/auth.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, RealtimeModule, NotificationsModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryStockService, PermissionsGuard],
  exports: [InventoryStockService, InventoryService],
})
export class InventoryModule {}
