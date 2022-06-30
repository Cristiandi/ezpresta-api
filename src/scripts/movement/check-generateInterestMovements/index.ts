import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from '../../../app.module';

import { MovementService } from '../../../modules/movement/movement.service';

(async () => {
  // getting the nest js app
  const application = await NestFactory.createApplicationContext(AppModule);

  const movementService = application.get(MovementService);

  Logger.log('INIT');

  await movementService.settleLoanInterests({
    loanUid: 'f7c473f3-72da-46aa-8ae1-a57d1b33bf90',
  });

  Logger.log('END');
})().catch((err) => console.error(err));
// .finally(() => process.exit(0));
