import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from '../../../app.module';

import { LoanService } from '../../../modules/loan/loan.service';

(async () => {
  // getting the nest js app
  const application = await NestFactory.createApplicationContext(AppModule);

  const loanService = application.get(LoanService);

  Logger.log('INIT');

  await loanService.create({
    key: '123',
    userAuthUid: 'pending',
    amount: 6000000,
    monthlyInterestRate: 0.025,
    monthlyInterestOverdueRate: 0.05,
    startDate: '2022-04-15',
  });

  Logger.log('END');
})()
  .catch((err) => console.error(err))
  .finally(() => process.exit(0));
