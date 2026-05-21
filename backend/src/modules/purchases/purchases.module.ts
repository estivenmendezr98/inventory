import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { AuthModule } from '../../auth/auth.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [AuthModule],
  controllers: [PurchasesController],
  providers: [PurchasesService, PermissionsGuard],
})
export class PurchasesModule {}
