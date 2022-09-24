import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const REDIS_CACHE_TTL_KEY = 'redisCacheTTL';

export const RedisCacheTTL = (ttl: number): CustomDecorator<string> =>
  SetMetadata(REDIS_CACHE_TTL_KEY, ttl);
