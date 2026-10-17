import { mailer } from '@/server/integrations/bindings';
import { buildMessage, type TransactionalEmail } from '@/server/notifications/message';
import { registerJob } from '../registry';

/**
 * Sends one Zamaro email (notifications/send-transactional-emails): the payload is the email as the
 * notification built it, so the worker renders and sends it without the database. A send the mail
 * server refuses throws, and the queue retries it (L2-065.2).
 */
export const SEND_EMAIL_JOB = 'notifications.send-email';

registerJob(SEND_EMAIL_JOB, async (payload) => {
  await mailer().send(buildMessage(payload as TransactionalEmail));
});
