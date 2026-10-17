import { randomUUID } from 'node:crypto';
import type { DateTime } from 'luxon';
import type { JobDescription, JobQueue, QueueName } from '@/server/contracts/job-queue';
import { jobHandler } from '@/server/jobs/registry';
import { reportFailedJob } from '@/server/jobs/report-failed-job';
import { backoffSeconds, MAX_ATTEMPTS } from '@/server/jobs/retry-policy';
import { now } from '@/server/support/clock';
import { runWithRequestContext } from '@/server/support/request-context';

export interface QueuedJob {
  id: string;
  queue: QueueName;
  name: string;
  payload: unknown;
  requestId: string | undefined;
  /** How many attempts have failed so far. */
  attempts: number;
  /** When the worker may next attempt it. */
  availableAt: DateTime;
}

export interface FailedJob {
  id: string;
  queue: QueueName;
  name: string;
  payload: unknown;
  requestId: string | undefined;
  attempts: number;
  exception: string;
  failedAt: DateTime;
}

/**
 * The job queue in tests (ADR-0028). Jobs run at once as they are queued, the way the sync driver
 * did, until `hold()`: then they wait for `workNext()`, one worker attempt at a time, with the
 * retry policy every real queue applies (retry-policy.ts) and the failed-jobs store the Worker keeps.
 */
export class InMemoryJobQueue implements JobQueue {
  readonly failed: FailedJob[] = [];
  private held = false;
  private readonly jobs: QueuedJob[] = [];

  hold(): void {
    this.held = true;
  }

  async dispatch(queue: QueueName, description: JobDescription): Promise<void> {
    const job: QueuedJob = {
      id: randomUUID(),
      queue,
      name: description.name,
      payload: description.payload,
      requestId: description.requestId,
      attempts: 0,
      availableAt: now(),
    };
    if (this.held) {
      this.jobs.push(job);
      return;
    }
    await this.attempt(job);
  }

  /** The jobs waiting on a queue, soonest first. */
  queued(queue: QueueName): QueuedJob[] {
    return this.jobs
      .filter((job) => job.queue === queue)
      .sort((a, b) => a.availableAt.toMillis() - b.availableAt.toMillis());
  }

  /** One worker attempt on the next due job of the queue; false when none is due. */
  async workNext(queue: QueueName, at: DateTime): Promise<boolean> {
    const job = this.queued(queue).find((candidate) => candidate.availableAt <= at);
    if (job === undefined) return false;
    this.jobs.splice(this.jobs.indexOf(job), 1);
    try {
      await this.attempt(job);
    } catch (error) {
      job.attempts += 1;
      if (job.attempts < MAX_ATTEMPTS) {
        job.availableAt = at.plus({ seconds: backoffSeconds(job.attempts) });
        this.jobs.push(job);
      } else {
        this.failed.push({ ...job, exception: describe(error), failedAt: at });
        reportFailedJob({
          name: job.name,
          queue: job.queue,
          attempts: job.attempts,
          requestId: job.requestId,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
    return true;
  }

  private attempt(job: QueuedJob): Promise<void> {
    const handler = jobHandler(job.name);
    return runWithRequestContext(
      { requestId: job.requestId ?? '', session: undefined, user: null },
      () =>
        handler(job.payload, {
          id: job.id,
          queue: job.queue,
          name: job.name,
          attempt: job.attempts + 1,
          requestId: job.requestId,
        }),
    );
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
