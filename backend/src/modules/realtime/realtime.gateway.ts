import { Logger } from '@nestjs/common';
import {
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RealtimeBroadcastService } from './realtime-broadcast.service';
import { RealtimeTokenService } from './realtime-token.service';

function socketCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts;
  }
  return [
    'http://localhost',
    'http://localhost:5173',
    'http://127.0.0.1',
    'http://127.0.0.1:5173',
  ];
}

@WebSocketGateway({
  cors: {
    origin: socketCorsOrigins(),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly log = new Logger(RealtimeGateway.name);

  constructor(
    private readonly tokens: RealtimeTokenService,
    private readonly broadcast: RealtimeBroadcastService,
  ) {}

  afterInit(server: Server) {
    this.broadcast.setServer(server);
  }

  async handleConnection(client: Socket) {
    const raw = client.handshake.auth?.token as string | undefined;
    if (!raw?.trim()) {
      this.log.warn('Socket sin token; desconectando');
      client.disconnect(true);
      return;
    }
    const bearer = raw.replace(/^Bearer\s+/i, '').trim();
    try {
      const payload = await this.tokens.verifyAccessToken(bearer);
      const user = await this.tokens.syncUserFromPayload(payload);
      client.data.userId = user.id;
      client.join('app');
      client.join(`user:${user.id}`);
    } catch (e) {
      this.log.warn(`WS auth falló: ${e instanceof Error ? e.message : String(e)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const uid = client.data?.userId as string | undefined;
    if (uid) {
      this.log.debug(`WS desconectado user=${uid}`);
    }
  }
}
