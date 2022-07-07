import { NestFactory } from '@nestjs/core';
import { ConflictException, Logger } from '@nestjs/common';

import { AppModule } from '../../../app.module';

import { EventMessageService } from '../../../modules/event-message/event-message.service';

(async () => {
  // getting the nest js app
  const application = await NestFactory.createApplicationContext(AppModule);

  const eventMessageService = application.get(EventMessageService);

  Logger.log('INIT');

  const eventMessage = await eventMessageService.create({
    routingKey: 'just.a.test',
    functionName: 'testingCreate',
    data: {
      test: 'test',
    },
  });

  await eventMessageService.setError({
    id: eventMessage._id,
    error: new ConflictException('test'),
  });

  Logger.log('END');
})().catch((err) => console.error(err));
// .finally(() => process.exit(0));
