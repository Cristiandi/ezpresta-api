import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import appConfig from '../../config/app.config';

import { LoanRequest } from './loan-request.entity';

import { LoanRequestService } from './loan-request.service';
import { LoanRequestController } from './loan-request.controller';

import { RabbitLocalModuleModule } from '../../plugins/rabbit-local-module/rabbit-local-module.module';
import { UserModule } from '../user/user.module';
import { MailingModule } from '../../plugins/mailing/mailing.module';
import { EventMessageModule } from '../event-message/event-message.module';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    TypeOrmModule.forFeature([LoanRequest]),
    RabbitLocalModuleModule,
    EventMessageModule,
    MailingModule,
    UserModule,
  ],
  providers: [LoanRequestService],
  controllers: [LoanRequestController],
})
export class LoanRequestModule {}
