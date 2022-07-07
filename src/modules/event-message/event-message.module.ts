import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import appConfig from '../../config/app.config';

import { EventMessageSchema } from './event-message.schema';

import { EventMessageService } from './event-message.service';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    MongooseModule.forFeature([
      { name: 'EventMessage', schema: EventMessageSchema },
    ]),
  ],
  providers: [EventMessageService],
  exports: [EventMessageService],
})
export class EventMessageModule {}
