import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthModule } from '../../auth/auth.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [AuthModule, InventoryModule],
  controllers: [ProductsController],
  providers: [ProductsService, PermissionsGuard],
})
export class ProductsModule {}
