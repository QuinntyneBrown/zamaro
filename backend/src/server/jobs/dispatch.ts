import type { QueueName } from '@/server/contracts/job-queue';
import { jobQueue } from '@/server/integrations/bindings';
import { currentRequestId } from '@/server/support/request-context';
// Every handler registers itself when the API process can queue work, so the in-process queue of
// tests resolves names the same way the Worker does.
import './index';

/** Queues a job for the Zamaro Worker, carrying the request that asked for it. */
export function dispatchJob(queue: QueueName, name: string, payload: unknown): Promise<void> {
  return jobQueue().dispatch(queue, { name, payload, requestId: currentRequestId() });
}
