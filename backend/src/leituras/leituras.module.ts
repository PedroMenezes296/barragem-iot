import { Module } from '@nestjs/common';

import { LeiturasController } from './leituras.controller.js';
import { LeiturasService } from './leituras.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [LeiturasController],
  providers: [LeiturasService],
})
export class LeiturasModule {}
