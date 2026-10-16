import Redis from 'ioredis';
import { config } from '@config/zamaro';
import type { Cache } from '@/server/contracts/cache';

/** The application's cache on the cache Redis connection, every key under REDIS_PREFIX. */
export class RedisCache implements Cache {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor() {
    const { redis } = config();
    this.client = new Redis(redis.cacheUrl, { lazyConnect: true, maxRetriesPerRequest: 2 });
    this.prefix = `${redis.prefix}cache:`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.client.get(this.prefix + key);
    return value === null ? undefined : (JSON.parse(value) as T);
  }

  async put(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(this.prefix + key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async forget(key: string): Promise<void> {
    await this.client.del(this.prefix + key);
  }
}
