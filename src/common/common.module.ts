import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BasicAclModule } from 'nestjs-basic-acl-sdk';

import appConfig from '../config/app.config';

import { AuthorizationGuard } from './guards/authorization.guard';

import { CacheInterceptor } from './interceptors/cache.interceptor';

import { LoggingMiddleware } from './middlewares/logging.middleware';

import { RedisCacheModule } from '../plugins/redis-cache/redis-cache.module';

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
    RedisCacheModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
