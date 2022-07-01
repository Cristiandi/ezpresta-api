import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import appConfig from '../../config/app.config';

import { LoanRequest } from './loan-request.entity';

import { LoanRequestService } from './loan-request.service';
import { LoanRequestController } from './loan-request.controller';

import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    TypeOrmModule.forFeature([LoanRequest]),
    UserModule,
  ],
  providers: [LoanRequestService],
  controllers: [LoanRequestController],
})
export class LoanRequestModule {}
