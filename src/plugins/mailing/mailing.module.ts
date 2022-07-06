import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from '../../config/app.config';

import { MailingService } from './mailing.service';

@Module({
  imports: [ConfigModule.forFeature(appConfig)],
  providers: [MailingService],
  exports: [MailingService],
})
export class MailingModule {}
