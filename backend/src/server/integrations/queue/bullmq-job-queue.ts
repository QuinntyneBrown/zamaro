import { Queue } from 'bullmq';
import { config } from '@config/zamaro';
import type { JobDescription, JobQueue, QueueName } from '@/server/contracts/job-queue';
import { MAX_ATTEMPTS } from '@/server/jobs/retry-policy';
import { redisConnection } from './redis-connection';

/** The job's data as BullMQ stores it; the Worker reads the same shape. */
export interface BullJobData {
  payload: unknown;
  requestId: string | undefined;
}

/**
 * BullMQ on Redis (ADR-0027): one BullMQ queue per QueueName under the Redis prefix. A job gets the
 * retry policy every job follows (retry-policy.ts); the Worker applies the backoff and keeps a job
 * that exhausts its attempts in the failed set, where Bull Board shows it for a re-run.
 */
export class BullMqJobQueue implements JobQueue {
  private readonly queues = new Map<QueueName, Queue>();

  async dispatch(queue: QueueName, job: JobDescription): Promise<void> {
    const data: BullJobData = { payload: job.payload, requestId: job.requestId };
    await this.queue(queue).add(job.name, data, {
      attempts: MAX_ATTEMPTS,
      backoff: { type: 'zamaro' },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async close(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
    this.queues.clear();
  }

  private queue(name: QueueName): Queue {
    let queue = this.queues.get(name);
    if (queue === undefined) {
      queue = new Queue(name, { connection: redisConnection(), prefix: config().redis.prefix });
      this.queues.set(name, queue);
    }
    return queue;
  }
}
