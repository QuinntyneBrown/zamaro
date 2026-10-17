import { createHash } from 'node:crypto';
import { DateTime } from 'luxon';
import { cache, rateLimiter } from '@/server/integrations/bindings';
import { now, ZONE } from '@/server/support/clock';

/**
 * The sign-in lockout (L2-072.4): 5 failures for one address within 15 minutes pause sign-in for that
 * address for 15 minutes. Counted by the address in lower case, whether or not it has an account, so
 * a pause says nothing about which addresses do.
 */
export const MAX_FAILURES = 5;
export const WINDOW_SECONDS = 900;
export const PAUSE_SECONDS = 900;

/** When sign-in resumes for the address, or null when it is not paused. */
export async function pausedUntil(email: string): Promise<DateTime | null> {
  const until = await cache().get<number>(pauseKey(email));
  return until === undefined ? null : DateTime.fromSeconds(until, { zone: ZONE });
}

/** A wrong password; the fifth within the window starts the pause. */
export async function recordFailure(email: string): Promise<void> {
  const decision = await rateLimiter().hit(failuresKey(email), MAX_FAILURES - 1, WINDOW_SECONDS);
  if (!decision.allowed) {
    await rateLimiter().clear(failuresKey(email));
    await cache().put(pauseKey(email), now().toSeconds() + PAUSE_SECONDS, PAUSE_SECONDS);
  }
}

/** A successful sign-in starts the count again. */
export async function clearFailures(email: string): Promise<void> {
  await rateLimiter().clear(failuresKey(email));
}

/** True the first time it is asked during a pause: the owner is emailed once per pause. */
export async function firstRefusal(email: string, until: DateTime): Promise<boolean> {
  const key = `${pauseKey(email)}:told`;
  if ((await cache().get<boolean>(key)) === true) return false;
  const seconds = Math.max(1, Math.ceil(until.diff(now(), 'seconds').seconds));
  await cache().put(key, true, seconds);
  return true;
}

function failuresKey(email: string): string {
  return `sign-in-failures:${createHash('sha256').update(email).digest('hex')}`;
}

function pauseKey(email: string): string {
  return `sign-in-paused:${createHash('sha256').update(email).digest('hex')}`;
}
