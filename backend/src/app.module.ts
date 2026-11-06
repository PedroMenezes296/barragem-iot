import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LeiturasModule } from './leituras/leituras.module.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }),
  LeiturasModule,
  PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
