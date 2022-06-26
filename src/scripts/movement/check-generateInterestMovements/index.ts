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
    loanUid: 'afee65ee-21dc-4301-be4d-c69eea48a246',
  });

  Logger.log('END');
})()
  .catch((err) => console.error(err))
  .finally(() => process.exit(0));
