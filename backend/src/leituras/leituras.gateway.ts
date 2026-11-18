import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, ServerOptions } from 'socket.io';
import type { LeituraResponseDto } from './dto/leitura-response.dto.js';

export function isAllowedWebsocketOrigin(origin: string | undefined): boolean {
  // Scripts locais e clientes nativos podem não enviar Origin.
  if (!origin) return true;
  const allowed =
    process.env.WS_ALLOWED_ORIGINS ??
    'http://localhost:3001,http://127.0.0.1:3001';
  return allowed
    .split(',')
    .map((value) => value.trim())
    .includes(origin);
}

interface ServerEvents {
  'leitura:criada': (event: Pick<LeituraResponseDto, 'id'>) => void;
  'alertas:configuracao': () => void;
}

@WebSocketGateway<Partial<ServerOptions>>({
  transports: ['websocket'],
  allowRequest: (request, callback) => {
    callback(null, isAllowedWebsocketOrigin(request.headers.origin));
  },
})
export class LeiturasGateway {
  private readonly logger = new Logger(LeiturasGateway.name);

  @WebSocketServer()
  private server?: Server<Record<string, never>, ServerEvents>;

  notifyCreated(id: string): void {
    try {
      this.server?.emit('leitura:criada', { id });
    } catch {
      // A leitura já foi persistida; uma falha no aviso não deve pedir reenvio.
      this.logger.error('Falha ao emitir aviso de leitura criada.');
    }
  }

  notifyAlarmSettingsChanged(): void {
    try {
      this.server?.emit('alertas:configuracao');
    } catch {
      this.logger.error('Falha ao emitir atualização dos limites.');
    }
  }
}
