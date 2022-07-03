import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from '../../config/app.config';

import { EpaycoTransaction } from './epayco-transaction.entity';

import { EpaycoTransactionService } from './epayco-transaction.service';

import { EpaycoTransactionController } from './epayco-transaction.controller';

import { LoanModule } from '../loan/loan.module';
import { RabbitLocalModuleModule } from 'src/plugins/rabbit-local-module/rabbit-local-module.module';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    TypeOrmModule.forFeature([EpaycoTransaction]),
    RabbitLocalModuleModule,
    LoanModule,
  ],
  providers: [EpaycoTransactionService],
  controllers: [EpaycoTransactionController],
  exports: [EpaycoTransactionService],
})
export class EpaycoTransactionModule {}
