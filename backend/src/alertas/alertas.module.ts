import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LeiturasRealtimeModule } from '../leituras/leituras-realtime.module.js';
import { AlertasService } from './alertas.service.js';
import { AlertasController } from './alertas.controller.js';

@Module({
  imports: [PrismaModule, LeiturasRealtimeModule],
  providers: [AlertasService],
  controllers: [AlertasController],
})
export class AlertasModule {}
