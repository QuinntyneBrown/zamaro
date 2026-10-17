import { randomInt } from 'node:crypto';

/**
 * The retry policy of every job (L2-092.1, L2-065.2): one attempt and up to 5 retries, after about
 * 10, 30, 90, 270 and 810 seconds (M2 D17). Each delay varies by up to 10 % so jobs that failed
 * together do not retry together. After the 6th failure the job is in the failed-jobs store and
 * reportFailedJob alerts.
 */
export const MAX_ATTEMPTS = 6;

const BACKOFF_SECONDS = [10, 30, 90, 270, 810];

/** Seconds to wait before the next attempt, given how many have failed so far. */
export function backoffSeconds(attemptsMade: number): number {
  const base = BACKOFF_SECONDS[Math.min(attemptsMade, BACKOFF_SECONDS.length) - 1] ?? 810;
  return Math.round((base * randomInt(90, 111)) / 100);
}
