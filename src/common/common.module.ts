import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BasicAclModule } from 'nestjs-basic-acl-sdk';

import appConfig from '../config/app.config';

import { AuthorizationGuard } from './guards/authorization.guard';

import { LoggingMiddleware } from './middlewares/logging.middleware';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    BasicAclModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          companyUid: configService.get<string>('config.acl.companyUid'),
          accessKey: configService.get<string>('config.acl.accessKey'),
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
