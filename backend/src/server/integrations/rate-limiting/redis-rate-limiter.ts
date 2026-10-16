import Redis from 'ioredis';
import { config } from '@config/zamaro';
import type { RateLimitDecision, RateLimiter } from '@/server/contracts/rate-limiter';

/** Fixed windows in Redis: INCR the key, set its expiry on the first hit, read the TTL when over. */
export class RedisRateLimiter implements RateLimiter {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor() {
    const { redis } = config();
    this.client = new Redis(redis.cacheUrl, { lazyConnect: true, maxRetriesPerRequest: 2 });
    this.prefix = `${redis.prefix}limit:`;
  }

  async hit(key: string, max: number, windowSeconds: number): Promise<RateLimitDecision> {
    const name = this.prefix + key;
    const hits = await this.client.incr(name);
    if (hits === 1) await this.client.expire(name, windowSeconds);
    if (hits <= max) return { allowed: true, retryAfterSeconds: 0 };
    const ttl = await this.client.ttl(name);
    return { allowed: false, retryAfterSeconds: Math.max(1, ttl) };
  }

  async clear(key: string): Promise<void> {
    await this.client.del(this.prefix + key);
  }
}
