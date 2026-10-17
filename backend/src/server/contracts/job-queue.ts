/**
 * Queued work (operations/run-background-jobs, ADR-0027): the API and Worker put jobs on three
 * queues, which the Zamaro Worker runs. BullMQ on Redis in the application; the in-memory queue in
 * tests, where each attempt is run by hand (ADR-0028).
 */
export type QueueName = 'high' | 'notifications' | 'default';

export interface JobDescription {
  /** The handler's name in src/server/jobs, e.g. `notifications.send-email`. */
  name: string;
  /** JSON-serialisable; the worker is another process. */
  payload: unknown;
  /** The request that queued the job, for its logs and failure reports. */
  requestId: string | undefined;
}

export interface JobQueue {
  dispatch(queue: QueueName, job: JobDescription): Promise<void>;
}
