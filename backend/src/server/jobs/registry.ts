import type { QueueName } from '@/server/contracts/job-queue';

/** What a handler knows about the job it is running. */
export interface RunningJob {
  id: string;
  queue: QueueName;
  name: string;
  attempt: number;
  requestId: string | undefined;
}

export type JobHandler = (payload: unknown, job: RunningJob) => Promise<void>;

const handlers = new Map<string, JobHandler>();

/** Each job module registers its handler under its name when it is imported (src/server/jobs/index.ts). */
export function registerJob(name: string, handler: JobHandler): void {
  handlers.set(name, handler);
}

export function jobHandler(name: string): JobHandler {
  const handler = handlers.get(name);
  if (handler === undefined) throw new Error(`No job handler is registered as ${name}.`);
  return handler;
}
