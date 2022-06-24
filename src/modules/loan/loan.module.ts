import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from '../../config/app.config';

import { Loan } from './loan.entity';

import { LoanService } from './loan.service';

import { UserModule } from '../user/user.module';
import { MovementModule } from '../movement/movement.module';
import { LoanController } from './loan.controller';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    TypeOrmModule.forFeature([Loan]),
    UserModule,
    forwardRef(() => MovementModule),
  ],
  providers: [LoanService],
  exports: [LoanService],
  controllers: [LoanController],
})
export class LoanModule {}
