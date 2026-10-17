import Redis from 'ioredis';
import { config } from '@config/zamaro';
import type { SessionData, SessionStore } from '@/server/contracts/session-store';

/** Sessions in Redis under REDIS_PREFIX, each key expiring at the idle limit (ADR-0015). */
export class RedisSessionStore implements SessionStore {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor() {
    const { redis } = config();
    this.client = new Redis(redis.url, { lazyConnect: true, maxRetriesPerRequest: 2 });
    this.prefix = `${redis.prefix}session:`;
  }

  async read(id: string): Promise<SessionData | null> {
    const data = await this.client.get(this.prefix + id);
    return data === null ? null : (JSON.parse(data) as SessionData);
  }

  async write(id: string, data: SessionData, ttlSeconds: number): Promise<void> {
    await this.client.set(this.prefix + id, JSON.stringify(data), 'EX', ttlSeconds);
  }

  async destroy(id: string): Promise<void> {
    await this.client.del(this.prefix + id);
  }
}
