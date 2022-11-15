import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common/services';
import { createClient, RedisClientType } from 'redis';

import { GetInput } from './dto/get-input.dto';

import { SetInput } from './dto/set-input.dto';

const KEY_PREFIX = 'ezpresta_';

@Injectable()
export class RedisCacheService {
  private client: RedisClientType;
  constructor() {
    this.init();
  }

  private async init() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
      },
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('error', (err) => {
      Logger.error(`Redis Client Error: ${err}`, RedisCacheService.name);
      throw err;
    });

    await this.client.connect();
  }

  public async set(input: SetInput): Promise<void> {
    const { keys, value, ttl = 0 } = input;

    const key = Object.keys(keys)
      .map((key) => keys[key])
      .join(':');

    const newValue = JSON.stringify(value);

    await this.client.set(KEY_PREFIX + key, newValue, {
      EX: ttl,
      NX: true,
    });
  }

  public async get(input: GetInput) {
    const { keys } = input;

    const key = Object.keys(keys)
      .map((key) => keys[key])
      .join(':');

    const value = await this.client.get(KEY_PREFIX + key);

    if (!value) return null;

    try {
      return JSON.parse(value as string);
    } catch (error) {
      console.error(error);
      return value;
    }
  }
}
