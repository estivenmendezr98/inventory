import { Module } from '@nestjs/common';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [CashRegisterController],
  providers: [CashRegisterService, PermissionsGuard],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
