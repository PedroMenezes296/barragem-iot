import { Module } from '@nestjs/common';
import { LeiturasService } from './leituras.service.js';
import { LeiturasController } from './leituras.controller.js';

@Module({
  controllers: [LeiturasController],
  providers: [LeiturasService],
})
export class LeiturasModule {}
