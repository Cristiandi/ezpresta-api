import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

import appConfig from './config/app.config';
import appSchema from './config/app.schema';
import ormConfig from './config/orm.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CommonModule } from './common/common.module';
import { UserModule } from './modules/user/user.module';
import { LoanModule } from './modules/loan/loan.module';
import { MovementTypeModule } from './modules/movement-type/movement-type.module';
import { MovementModule } from './modules/movement/movement.module';
import { NotificationModule } from './modules/notification/notification.module';
import { LoanRequestModule } from './modules/loan-request/loan-request.module';
import { EpaycoTransactionModule } from './modules/epayco-transaction/epayco-transaction.module';
import { MailingModule } from './plugins/mailing/mailing.module';
import { EventMessageModule } from './modules/event-message/event-message.module';

@Module({
  imports: [
    // config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: appSchema,
    }),

    // TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          ...ormConfig,
          logging: configService.get<string>('config.database.log') === 'yes',
          timezone: 'Z',
        };
      },
    }),

    // Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<string>('config.mongoDB.uri'),
        };
      },
    }),

    CommonModule,

    UserModule,

    LoanModule,

    MovementTypeModule,

    MovementModule,

    NotificationModule,

    LoanRequestModule,

    EpaycoTransactionModule,

    MailingModule,

    EventMessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
