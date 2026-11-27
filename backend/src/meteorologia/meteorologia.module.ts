import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeteorologiaController } from './meteorologia.controller.js';
import { MeteorologiaService } from './meteorologia.service.js';

@Module({
  imports: [ConfigModule],
  controllers: [MeteorologiaController],
  providers: [MeteorologiaService],
})
export class MeteorologiaModule {}
