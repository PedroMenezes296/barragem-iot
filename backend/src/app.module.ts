import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LeiturasModule } from './leituras/leituras.module.js';

@Module({
  imports: [LeiturasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
