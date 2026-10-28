
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  // Conecta ao MongoDB quando o módulo inicia
  async onModuleInit() {
    await this.$connect();

    this.logger.log('MongoDB conectado com sucesso!');
  }

  // Desconecta quando o módulo é encerrado
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
