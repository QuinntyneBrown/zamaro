import type { Cache } from '@/server/contracts/cache';
import { now } from '@/server/support/clock';

/** An in-memory cache for tests and single-process development; entries expire by the API's clock. */
export class InMemoryCache implements Cache {
  private readonly entries = new Map<string, { value: string; expiresAt: number }>();

  get<T>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);
    if (entry === undefined) return Promise.resolve(undefined);
    if (entry.expiresAt <= now().toMillis()) {
      this.entries.delete(key);
      return Promise.resolve(undefined);
    }
    return Promise.resolve(JSON.parse(entry.value) as T);
  }

  put(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.entries.set(key, {
      value: JSON.stringify(value),
      expiresAt: now().toMillis() + ttlSeconds * 1000,
    });
    return Promise.resolve();
  }

  forget(key: string): Promise<void> {
    this.entries.delete(key);
    return Promise.resolve();
  }
}
