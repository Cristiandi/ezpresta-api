import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { map, Observable, of } from 'rxjs';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';

import appConfig from '../../config/app.config';

import { RedisCacheService } from '../../plugins/redis-cache/redis-cache.service';

import { REDIS_CACHE_TTL_KEY } from '../../plugins/redis-cache/decorators/redis-cache-ttl.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const shouldSkip = isRabbitContext(context);
    if (shouldSkip) return next.handle();

    // if we're in local mode, skip the cache
    if (this.appConfiguration.environment === 'local') {
      return next.handle();
    }

    // check if the request is public
    const redisCacheTTL = this.reflector.get<number>(
      REDIS_CACHE_TTL_KEY,
      context.getHandler(),
    );

    // if the redis cache ttl is 0, skip the cache
    if (redisCacheTTL === 0) {
      return next.handle();
    }

    // get the request from the context
    const request = context.switchToHttp().getRequest<Request>();

    const { environment } = this.appConfiguration;

    const userIp = request?.connection?.remoteAddress || request?.ip;

    const { method, path } = request;

    const cache = await this.redisCacheService.get({
      keys: {
        environment,
        userIp,
        method,
        path,
      },
    });

    if (cache) {
      return of(cache);
    }

    return next.handle().pipe(
      map((data) => {
        this.redisCacheService
          .set({
            keys: {
              environment,
              userIp,
              method,
              path,
            },
            value: data,
            ttl: redisCacheTTL || 60,
          })
          .catch((error) => {
            console.error(error);
          });

        return data;
      }),
    );
  }
}
