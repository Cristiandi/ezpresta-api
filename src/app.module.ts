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
import { RedisCacheModule } from './plugins/redis-cache/redis-cache.module';

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

    // Redis cache
    RedisCacheModule,

    // Cache
    /*
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      name: process.env.REDIS_CLIENT_NAME,
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      ttl: 1,
    }),
    */

    /*
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          isGlobal: true,
          store: redisStore,
          name: configService.get<string>('config.redis.clientName'),
          host: configService.get<string>('config.redis.host'),
          port: configService.get<number>('config.redis.port'),
          password: configService.get<string>('config.redis.password'),
          ttl: 60,
        };
      },
    }),
    */

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
