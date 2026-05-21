import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserSessionsService } from './user-sessions.service';
import { KeycloakWebhookService } from './keycloak-webhook.service';
import { KeycloakWebhookGuard } from './guards/keycloak-webhook.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, AuthService, UserSessionsService, KeycloakWebhookService, KeycloakWebhookGuard],
  controllers: [AuthController],
  exports: [PassportModule, AuthService, UserSessionsService],
})
export class AuthModule {}
