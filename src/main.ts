import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  // create nestjs app
  const app = await NestFactory.create(AppModule);

  // getting the config service
  const configService = app.get(ConfigService);

  // getting the port env var
  const PORT = configService.get<number>('config.app.port');

  // getting the environment var
  const ENV = configService.get<string>('config.environment');

  app.enableCors();

  await app.listen(PORT, () => {
    Logger.log(`app listening at ${PORT} in ${ENV}`, 'main.ts');
  });
}

bootstrap();
