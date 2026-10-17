import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sendDuplicateSignUp } from '@/server/notifications/accounts/duplicate-sign-up';
import { sendVerifyEmail } from '@/server/notifications/accounts/verify-email';
import { now } from '@/server/support/clock';
import { resetClock, travel } from '../../support/clock';
import { closeDatabase, freshDatabase } from '../../support/database';
import {
  failTheMailTransport,
  failedJobs,
  holdJobs,
  queuedJob,
  workNextJob,
} from '../../support/jobs';
import { sentEmails } from '../../support/mail';

const RUTH = { name: 'Ruth Adeyemi', email: 'ruth.adeyemi@gracepoint.ca' };
const DELAYS = [10, 30, 90, 270, 810];

/**
 * L2-065.2: an email that cannot be sent is retried with exponential backoff up to 5 times before it
 * fails and alerts (M2 D17: 10, 30, 90, 270 and 810 s, ±10 %). L2-063.2: every email has HTML and
 * plain-text parts and no card details (notifications/send-transactional-emails).
 */
describe('email delivery', () => {
  beforeAll(async () => {
    await freshDatabase({ seed: false });
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase({ seed: false });
    resetClock();
  });

  it('retries an email the mail server refuses on notifications after growing delays', async () => {
    holdJobs();
    failTheMailTransport();
    await sendVerifyEmail(RUTH, 'plain-token', '/');

    for (const [index, delay] of DELAYS.entries()) {
      await workNextJob('notifications');

      const job = queuedJob('notifications');
      expect(job, `Attempt ${String(index + 1)} should be released for a retry.`).toBeDefined();
      expect(job?.queue).toBe('notifications');
      expect(job?.attempts).toBe(index + 1);
      const wait = (job?.availableAt.toSeconds() ?? 0) - now().toSeconds();
      expect(wait, `Retry ${String(index)}'s delay`).toBeGreaterThanOrEqual(
        Math.floor(delay * 0.9),
      );
      expect(wait, `Retry ${String(index)}'s delay`).toBeLessThanOrEqual(Math.ceil(delay * 1.1));

      travel({ seconds: wait });
    }

    await workNextJob('notifications');

    expect(queuedJob('notifications'), 'The 6th failed attempt is the last.').toBeUndefined();
    expect(failedJobs('notifications')).toHaveLength(1);
  });

  it('does not attempt a job that is not due yet', async () => {
    holdJobs();
    failTheMailTransport();
    await sendVerifyEmail(RUTH, 'plain-token', '/');
    await workNextJob('notifications');

    travel({ seconds: 8 });
    await workNextJob('notifications');

    expect(queuedJob('notifications')?.attempts).toBe(1);
  });

  it('gives every Zamaro email html and plain-text parts and no card number', async () => {
    const emails = [sendVerifyEmail(RUTH, 'plain-token', '/'), sendDuplicateSignUp(RUTH, now())];
    await Promise.all(emails);

    const sent = sentEmails();
    expect(sent).toHaveLength(emails.length);
    for (const email of sent) {
      expect(email.html, email.subject).not.toBe('');
      expect(email.text, email.subject).not.toBe('');
      for (const part of [email.html, email.text]) {
        expect(part, email.subject).not.toMatch(/(?<![\w-])\d(?:[ -]?\d){11,18}(?![\w-])/);
      }
    }
  });
});
