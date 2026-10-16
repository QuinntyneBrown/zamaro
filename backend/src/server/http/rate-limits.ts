import type { NextRequest } from 'next/server';
import { config } from '@config/zamaro';
import { rateLimiter } from '@/server/integrations/bindings';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { clientAddress } from './client-address';

/** Named rate limiters (L2-077, security/limit-request-rates); each route names the one it is behind. */
export type RateLimitName = 'search';

interface Limit {
  key: string;
  max: number;
  windowSeconds: number;
}

/** The limits a request meets under a name; a signed-in person's per-account limits arrive with sessions. */
function limitsFor(name: RateLimitName, request: NextRequest): Limit[] {
  const { rateLimits } = config();
  const address = clientAddress(request);
  const limits: Record<RateLimitName, Limit[]> = {
    // L2-077.2: 30 searches a minute per address and, once signed in, per account as well.
    search: [{ key: `search-ip:${address}`, max: rateLimits.searchPerMinute, windowSeconds: 60 }],
  };
  return limits[name];
}

/** Counts the request against every limit under the name; over any of them, a 429 problem. */
export async function enforceRateLimit(name: RateLimitName, request: NextRequest): Promise<void> {
  for (const limit of limitsFor(name, request)) {
    const decision = await rateLimiter().hit(limit.key, limit.max, limit.windowSeconds);
    if (!decision.allowed) {
      throw new HttpProblem(ProblemType.TooManyRequests, {
        detail: `Try again in ${String(decision.retryAfterSeconds)} seconds.`,
        headers: { 'Retry-After': String(decision.retryAfterSeconds) },
      });
    }
  }
}
