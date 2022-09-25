import * as redisStore from 'cache-manager-redis-store';

import { Module, CacheModule } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { Logger } from '@nestjs/common/services';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => {
        Logger.log('Connecting to Redis Cache', 'RedisCacheModule');

        return {
          store: redisStore,
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
          name: process.env.REDIS_CLIENT_NAME,
        };
      },
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
