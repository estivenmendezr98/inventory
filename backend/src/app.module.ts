import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { KeycloakModule } from './common/keycloak/keycloak.module';
import { RedisModule } from './common/redis/redis.module';
import { ObjectStorageModule } from './common/storage/object-storage.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { KardexModule } from './modules/kardex/kardex.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { PosModule } from './modules/pos/pos.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BackupsModule } from './modules/backups/backups.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditModule } from './modules/audit/audit.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    KeycloakModule,
    AuthModule,
    RealtimeModule,
    RedisModule,
    ObjectStorageModule,
    AuditModule,
    HealthModule,
    DashboardModule,
    ProductsModule,
    CategoriesModule,
    InventoryModule,
    KardexModule,
    SuppliersModule,
    PurchasesModule,
    CustomersModule,
    SalesModule,
    PosModule,
    CashRegisterModule,
    InvoicesModule,
    ReportsModule,
    UsersModule,
    RolesModule,
    SettingsModule,
    NotificationsModule,
    BackupsModule,
    DocumentsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
