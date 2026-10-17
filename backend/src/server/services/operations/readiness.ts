import { sql } from 'drizzle-orm';
import Redis from 'ioredis';
import { config } from '@config/zamaro';
import type { HealthCheck } from '@/server/contracts/health-check';
import { db } from '@/server/db/client';

/**
 * Readiness (L2-090.2, ADR-0005): the database answers `SELECT 1`, and the cache and queue Redis
 * connections answer PING. A refused connection fails at once; a hung one fails after two seconds.
 * The checks are a port (ADR-0028): tests bind checks that pass or fail by name.
 */
export type Readiness = { status: 'ready' } | { status: 'not ready'; failed: string[] };

let bound: HealthCheck[] | undefined;

export function useHealthChecks(checks: HealthCheck[] | undefined): void {
  bound = checks;
}

export async function checkReadiness(): Promise<Readiness> {
  const checks = bound ?? defaultChecks();
  const results = await Promise.allSettled(checks.map((check) => check.run()));
  const failed = checks
    .filter((_, index) => results[index]?.status === 'rejected')
    .map((check) => check.name);
  return failed.length === 0 ? { status: 'ready' } : { status: 'not ready', failed };
}

function defaultChecks(): HealthCheck[] {
  const { redis } = config();
  return [
    { name: 'database', run: pingDatabase },
    { name: 'cache', run: () => pingRedis(redis.cacheUrl) },
    { name: 'queue', run: () => pingRedis(redis.queueUrl) },
  ];
}

async function pingDatabase(): Promise<void> {
  await Promise.race([db().execute(sql`SELECT 1`), timeout(2000)]);
}

async function pingRedis(url: string): Promise<void> {
  const client = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
    enableOfflineQueue: false,
  });
  try {
    await client.connect();
    await client.ping();
  } finally {
    client.disconnect();
  }
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`no answer within ${String(ms)} ms`));
    }, ms);
  });
}
