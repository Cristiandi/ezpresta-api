import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from '../../config/app.config';

import { NotificationService } from './notification.service';

import { UserModule } from '../user/user.module';
import { LoanModule } from '../loan/loan.module';
import { MovementModule } from '../movement/movement.module';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    UserModule,
    LoanModule,
    MovementModule,
  ],
  providers: [NotificationService],
})
export class NotificationModule {}
