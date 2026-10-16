import type { RateLimitDecision, RateLimiter } from '@/server/contracts/rate-limiter';
import { now } from '@/server/support/clock';

/** An in-memory limiter for tests and single-process development; windows follow the API's clock. */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { startedAt: number; hits: number }>();

  hit(key: string, max: number, windowSeconds: number): Promise<RateLimitDecision> {
    const at = now().toMillis();
    let window = this.windows.get(key);
    if (window === undefined || window.startedAt + windowSeconds * 1000 <= at) {
      window = { startedAt: at, hits: 0 };
      this.windows.set(key, window);
    }
    window.hits++;
    if (window.hits <= max) return Promise.resolve({ allowed: true, retryAfterSeconds: 0 });
    return Promise.resolve({
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((window.startedAt + windowSeconds * 1000 - at) / 1000),
      ),
    });
  }

  clear(key: string): Promise<void> {
    this.windows.delete(key);
    return Promise.resolve();
  }
}
