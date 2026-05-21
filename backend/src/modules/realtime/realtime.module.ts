import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeBroadcastService } from './realtime-broadcast.service';
import { RealtimeTokenService } from './realtime-token.service';

@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway, RealtimeBroadcastService, RealtimeTokenService],
  exports: [RealtimeBroadcastService],
})
export class RealtimeModule {}
