import { config } from '@config/zamaro';
import type { QueueName } from '@/server/contracts/job-queue';
import { AlertSeverity } from '@/server/enums';
import { errorReporter, onCallAlerter } from '@/server/integrations/bindings';
import { logger } from '@/server/support/logger';

export interface FailedAttempt {
  name: string;
  queue: QueueName;
  attempts: number;
  requestId: string | undefined;
  error: Error;
}

/**
 * A job that exhausted its attempts (L2-092.1, operations/run-background-jobs). The queue keeps it
 * in the failed-jobs store; this reports the error and pages the on-call person, who re-runs it
 * once the cause is fixed. The request ID is the one that queued the job, carried in its payload.
 */
export function reportFailedJob(failed: FailedAttempt): void {
  const { name, queue, attempts, requestId, error } = failed;
  const context = { job: name, queue, attempts };
  logger().error({ err: error, ...context, requestId }, 'job failed');
  errorReporter().report(error, requestId, config().release, context);
  onCallAlerter().raise({
    key: 'job-failed',
    summary: `${name} failed after ${String(attempts)} attempts (request ${requestId ?? 'none'})`,
    severity: AlertSeverity.Critical,
    context: { ...context, requestId },
  });
}
