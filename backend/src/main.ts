import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = Number(configService.get('PORT') ?? 3000);
  const host = configService.get<string>('HOST') ?? '127.0.0.1';

  console.log('Porta:', port);
  console.log('Host:', host);

  await app.listen(port, host);
}

void bootstrap();