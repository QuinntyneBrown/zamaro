import Redis from 'ioredis';
import postgres from 'postgres';
import { config } from '@config/zamaro';

/**
 * Readiness (L2-090.2, ADR-0005): the database answers `SELECT 1`, and the cache and queue Redis
 * connections answer PING. A refused connection fails at once; a hung one fails after two seconds.
 */
export type Readiness = { status: 'ready' } | { status: 'not ready'; failed: string[] };

interface Check {
  name: string;
  run: () => Promise<void>;
}

export async function checkReadiness(): Promise<Readiness> {
  const { databaseUrl, redis } = config();
  const checks: Check[] = [
    { name: 'database', run: () => pingDatabase(databaseUrl) },
    { name: 'cache', run: () => pingRedis(redis.cacheUrl) },
    { name: 'queue', run: () => pingRedis(redis.queueUrl) },
  ];
  const results = await Promise.allSettled(checks.map((check) => check.run()));
  const failed = checks
    .filter((_, index) => results[index]?.status === 'rejected')
    .map((c) => c.name);
  return failed.length === 0 ? { status: 'ready' } : { status: 'not ready', failed };
}

async function pingDatabase(url: string): Promise<void> {
  const sql = postgres(url, { max: 1, connect_timeout: 2, idle_timeout: 1 });
  try {
    await sql`SELECT 1`;
  } finally {
    await sql.end({ timeout: 1 });
  }
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
