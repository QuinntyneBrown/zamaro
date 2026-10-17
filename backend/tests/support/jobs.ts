import { expect } from 'vitest';
import type { QueueName } from '@/server/contracts/job-queue';
import { errorReporter, jobQueue, mailer, onCallAlerter } from '@/server/integrations/bindings';
import { FakeOnCallAlerter } from '@/server/integrations/alerting/fake-on-call-alerter';
import { FakeErrorReporter } from '@/server/integrations/error-tracking/fake-error-reporter';
import { FakeMailer } from '@/server/integrations/mail/fake-mailer';
import {
  InMemoryJobQueue,
  type FailedJob,
  type QueuedJob,
} from '@/server/integrations/queue/in-memory-job-queue';
import { MailTransportError } from '@/server/contracts/mailer';
import { now } from '@/server/support/clock';
import { travel } from './clock';

/**
 * The job queue as the Zamaro Worker sees it (ADR-0028): jobs are held rather than run at once, and
 * each `workNextJob` is one attempt by the worker, at the frozen clock's time.
 */
export function holdJobs(): InMemoryJobQueue {
  const queue = inMemoryQueue();
  queue.hold();
  return queue;
}

export function queuedJob(queue: QueueName = 'notifications'): QueuedJob | undefined {
  return inMemoryQueue().queued(queue)[0];
}

export function failedJobs(queue?: QueueName): FailedJob[] {
  return inMemoryQueue().failed.filter((job) => queue === undefined || job.queue === queue);
}

/** The worker's next attempt on the queue, if a job is due. */
export function workNextJob(queue: QueueName = 'notifications'): Promise<boolean> {
  return inMemoryQueue().workNext(queue, now());
}

/** Every attempt, each when its backoff has passed; returns how many there were. */
export async function workUntilTheQueueIsEmpty(
  queue: QueueName = 'notifications',
): Promise<number> {
  let attempts = 0;
  for (; attempts < 10; attempts++) {
    const job = queuedJob(queue);
    if (job === undefined) break;
    const wait = Math.max(0, job.availableAt.toSeconds() - now().toSeconds());
    if (wait > 0) travel({ seconds: wait });
    await workNextJob(queue);
  }
  expect(queuedJob(queue)).toBeUndefined();
  return attempts;
}

/** The mail server refuses every email until `restoreTheMailTransport()`. */
export function failTheMailTransport(): void {
  fakeMailer().failWith(new MailTransportError('Connection refused by smtp.zamaro.test:587'));
}

export function restoreTheMailTransport(): void {
  fakeMailer().failWith(undefined);
}

export function errorReports(): FakeErrorReporter['reports'] {
  const bound = errorReporter();
  if (!(bound instanceof FakeErrorReporter)) throw new Error('The suite binds the fake reporter.');
  return bound.reports;
}

export function alerts(): FakeOnCallAlerter['alerts'] {
  const bound = onCallAlerter();
  if (!(bound instanceof FakeOnCallAlerter)) throw new Error('The suite binds the fake alerter.');
  return bound.alerts;
}

function inMemoryQueue(): InMemoryJobQueue {
  const bound = jobQueue();
  if (!(bound instanceof InMemoryJobQueue)) throw new Error('The suite binds the in-memory queue.');
  return bound;
}

function fakeMailer(): FakeMailer {
  const bound = mailer();
  if (!(bound instanceof FakeMailer)) throw new Error('The suite binds the fake mailer.');
  return bound;
}
