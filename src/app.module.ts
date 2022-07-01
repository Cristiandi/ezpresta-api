import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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

    CommonModule,

    UserModule,

    LoanModule,

    MovementTypeModule,

    MovementModule,

    NotificationModule,

    LoanRequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
