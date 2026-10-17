import type { NextRequest } from 'next/server';
import { config } from '@config/zamaro';
import { rateLimiter } from '@/server/integrations/bindings';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { clientAddress } from './client-address';

/** Named rate limiters (L2-077, security/limit-request-rates); each route names the one it is behind. */
export type RateLimitName = 'api' | 'search' | 'register' | 'resend-verification';

interface Limit {
  key: string;
  max: number;
  windowSeconds: number;
}

/** The limits a request meets under a name: anonymous traffic by address, a signed-in person by account too. */
function limitsFor(name: RateLimitName, request: NextRequest, user: CurrentUser | null): Limit[] {
  const { rateLimits } = config();
  const address = clientAddress(request);
  const limits: Record<RateLimitName, Limit[]> = {
    // L2-077.1: every /api/v1 request. Anonymous traffic is counted by address; a signed-in person
    // by account, wherever they connect from (M2 D7).
    api:
      user === null
        ? [{ key: `api-ip:${address}`, max: rateLimits.apiPerMinute, windowSeconds: 60 }]
        : [
            {
              key: `api-user:${String(user.id)}`,
              max: rateLimits.apiSignedInPerMinute,
              windowSeconds: 60,
            },
          ],
    // L2-077.3: 10 registrations an hour per address.
    register: [
      { key: `register-ip:${address}`, max: rateLimits.registerPerHour, windowSeconds: 3600 },
    ],
    // M2 D6: 3 new verification links in 15 minutes per address and, once signed in, per account.
    'resend-verification': [
      {
        key: `resend-verification-ip:${address}`,
        max: rateLimits.resendVerificationPer15Minutes,
        windowSeconds: 900,
      },
      ...(user === null
        ? []
        : [
            {
              key: `resend-verification-user:${String(user.id)}`,
              max: rateLimits.resendVerificationPer15Minutes,
              windowSeconds: 900,
            },
          ]),
    ],
    // L2-077.2: 30 searches a minute per address and, once signed in, per account as well.
    search: [
      { key: `search-ip:${address}`, max: rateLimits.searchPerMinute, windowSeconds: 60 },
      ...(user === null
        ? []
        : [
            {
              key: `search-user:${String(user.id)}`,
              max: rateLimits.searchPerMinute,
              windowSeconds: 60,
            },
          ]),
    ],
  };
  return limits[name];
}

/** Counts the request against every limit under the name; over any of them, a 429 problem. */
export async function enforceRateLimit(
  name: RateLimitName,
  request: NextRequest,
  user: CurrentUser | null = null,
): Promise<void> {
  for (const limit of limitsFor(name, request, user)) {
    const decision = await rateLimiter().hit(limit.key, limit.max, limit.windowSeconds);
    if (!decision.allowed) {
      throw new HttpProblem(ProblemType.TooManyRequests, {
        detail: `Try again in ${String(decision.retryAfterSeconds)} seconds.`,
        headers: { 'Retry-After': String(decision.retryAfterSeconds) },
      });
    }
  }
}
