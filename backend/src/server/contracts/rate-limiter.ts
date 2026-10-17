export interface RateLimitDecision {
  allowed: boolean;
  /** Seconds until the window opens again; 0 when allowed. */
  retryAfterSeconds: number;
}

/**
 * Counts hits per key in fixed windows (L2-077): Redis in the application, in memory in tests
 * (ADR-0028). The named limits live in src/server/http/rate-limits.ts.
 */
export interface RateLimiter {
  hit(key: string, max: number, windowSeconds: number): Promise<RateLimitDecision>;
  /** Forgets a key, so the next hit starts a window (a successful sign-in clears its lockout). */
  clear(key: string): Promise<void>;
}
