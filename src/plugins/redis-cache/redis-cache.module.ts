import { redisStore } from 'cache-manager-redis-store';

import { Module, CacheModule, CacheModuleOptions } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

@Module({
  imports: [],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
