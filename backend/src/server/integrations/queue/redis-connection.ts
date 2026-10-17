import type { ConnectionOptions } from 'bullmq';
import { config } from '@config/zamaro';

/**
 * How BullMQ reaches the queue Redis: the options REDIS_QUEUE_URL spells out, with the unlimited
 * retries per request a worker needs. BullMQ opens its own client from them.
 */
export function redisConnection(): ConnectionOptions {
  const url = new URL(config().redis.queueUrl);
  const db = Number(url.pathname.replace(/^\//, ''));
  return {
    host: url.hostname,
    port: url.port === '' ? 6379 : Number(url.port),
    ...(url.username !== '' && { username: decodeURIComponent(url.username) }),
    ...(url.password !== '' && { password: decodeURIComponent(url.password) }),
    ...(Number.isInteger(db) && db > 0 && { db }),
    ...(url.protocol === 'rediss:' && { tls: {} }),
    maxRetriesPerRequest: null,
  };
}
