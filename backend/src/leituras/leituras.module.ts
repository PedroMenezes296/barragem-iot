import { Module } from '@nestjs/common';

import { LeiturasController } from './leituras.controller.js';
import { LeiturasService } from './leituras.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LeiturasGateway } from './leituras.gateway.js';

@Module({
  imports: [PrismaModule],
  controllers: [LeiturasController],
  providers: [LeiturasService, LeiturasGateway],
})
export class LeiturasModule {}
