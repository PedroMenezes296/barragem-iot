import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common/pipes/index.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(configService.get('PORT') ?? 3000);
  const host = configService.get<string>('HOST') ?? '127.0.0.1';

  console.log('Porta:', port);
  console.log('Host:', host);

  await app.listen(port, host);
}

void bootstrap();