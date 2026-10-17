import { dispatchJob } from '@/server/jobs/dispatch';
import { SEND_EMAIL_JOB } from '@/server/jobs/notifications/send-email';
import type { TransactionalEmail } from './message';

/**
 * Every Zamaro email (notifications/send-transactional-emails, ADR-0019) is queued on
 * `notifications` for the Zamaro Worker, which renders and sends it; a send the mail server refuses
 * is retried on the policy every job follows (L2-065.2). Callers queue after their transaction has
 * committed, so no email describes a rolled-back change.
 */
export function sendTransactionalEmail(email: TransactionalEmail): Promise<void> {
  return dispatchJob('notifications', SEND_EMAIL_JOB, email);
}

export {
  buildMessage,
  copy,
  emailDate,
  emailTime,
  firstName,
  webUrl,
  type EmailBlock,
  type Recipient,
  type TransactionalEmail,
} from './message';
