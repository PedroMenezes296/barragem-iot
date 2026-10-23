import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LeiturasModule } from './leituras/leituras.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }),
  LeiturasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
