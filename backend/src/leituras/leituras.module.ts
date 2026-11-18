import { Module } from '@nestjs/common';

import { LeiturasController } from './leituras.controller.js';
import { LeiturasService } from './leituras.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LeiturasRealtimeModule } from './leituras-realtime.module.js';

@Module({
  imports: [PrismaModule, LeiturasRealtimeModule],
  controllers: [LeiturasController],
  providers: [LeiturasService],
})
export class LeiturasModule {}
