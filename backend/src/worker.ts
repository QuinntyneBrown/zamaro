import { Worker, type Job } from 'bullmq';
import { config } from '@config/zamaro';
import type { QueueName } from '@/server/contracts/job-queue';
import type { BullJobData } from '@/server/integrations/queue/bullmq-job-queue';
import { redisConnection } from '@/server/integrations/queue/redis-connection';
import { jobHandler } from '@/server/jobs';
import { reportFailedJob } from '@/server/jobs/report-failed-job';
import { backoffSeconds, MAX_ATTEMPTS } from '@/server/jobs/retry-policy';
import { logger } from '@/server/support/logger';
import { runWithRequestContext } from '@/server/support/request-context';

/**
 * The Zamaro Worker (ADR-0027): BullMQ workers for the `high`, `notifications` and `default`
 * queues. Each attempt runs the job's handler under the request ID that queued it; a failure is
 * retried on the policy every job follows, and the 6th failure stays in the failed set and is
 * reported (L2-092.1).
 */
const QUEUES: QueueName[] = ['high', 'notifications', 'uploads', 'default'];

export function startWorkers(): Worker[] {
  return QUEUES.map((queue) =>
    new Worker<BullJobData>(queue, (job) => runAttempt(queue, job), {
      connection: redisConnection(),
      prefix: config().redis.prefix,
      settings: { backoffStrategy: (attemptsMade) => backoffSeconds(attemptsMade) * 1000 },
    })
      .on('failed', (job, error) => {
        if (job === undefined || job.attemptsMade < MAX_ATTEMPTS) return;
        reportFailedJob({
          name: job.name,
          queue,
          attempts: job.attemptsMade,
          requestId: job.data.requestId,
          error,
        });
      })
      .on('error', (error) => {
        logger().error({ err: error, queue }, 'worker error');
      }),
  );
}

function runAttempt(queue: QueueName, job: Job<BullJobData>): Promise<void> {
  const handler = jobHandler(job.name);
  return runWithRequestContext(
    { requestId: job.data.requestId ?? '', session: undefined, user: null },
    () =>
      handler(job.data.payload, {
        id: job.id ?? '',
        queue,
        name: job.name,
        attempt: job.attemptsMade + 1,
        requestId: job.data.requestId,
      }),
  );
}

if (
  process.argv[1]?.endsWith('worker.ts') === true ||
  process.argv[1]?.endsWith('worker.js') === true
) {
  const workers = startWorkers();
  logger().info({ queues: QUEUES }, 'worker started');
  const stop = async (): Promise<void> => {
    await Promise.all(workers.map((worker) => worker.close()));
    process.exit(0);
  };
  process.on('SIGTERM', () => void stop());
  process.on('SIGINT', () => void stop());
}
