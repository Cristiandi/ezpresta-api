import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from '../../config/app.config';

import { EpaycoTransaction } from './epayco-transaction.entity';

import { EpaycoTransactionService } from './epayco-transaction.service';

import { EpaycoTransactionController } from './epayco-transaction.controller';

import { LoanModule } from '../loan/loan.module';
import { RabbitLocalModuleModule } from '../../plugins/rabbit-local-module/rabbit-local-module.module';
import { MovementModule } from '../movement/movement.module';
import { EventMessageModule } from '../event-message/event-message.module';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    TypeOrmModule.forFeature([EpaycoTransaction]),
    RabbitLocalModuleModule,
    EventMessageModule,
    LoanModule,
    MovementModule,
  ],
  providers: [EpaycoTransactionService],
  controllers: [EpaycoTransactionController],
  exports: [EpaycoTransactionService],
})
export class EpaycoTransactionModule {}
