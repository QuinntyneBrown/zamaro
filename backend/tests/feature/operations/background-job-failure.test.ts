import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { reloadConfig } from '@config/zamaro';
import { AlertSeverity } from '@/server/enums';
import { errorReporter } from '@/server/integrations/bindings';
import { SEND_EMAIL_JOB } from '@/server/jobs/notifications/send-email';
import { sendVerifyEmail } from '@/server/notifications/accounts/verify-email';
import { now } from '@/server/support/clock';
import { runWithRequestContext } from '@/server/support/request-context';
import { UUID } from '../../support/app';
import { resetClock, travel } from '../../support/clock';
import { closeDatabase, freshDatabase } from '../../support/database';
import {
  alerts,
  errorReports,
  failTheMailTransport,
  failedJobs,
  holdJobs,
  queuedJob,
  restoreTheMailTransport,
  workNextJob,
  workUntilTheQueueIsEmpty,
} from '../../support/jobs';
import { sentEmails } from '../../support/mail';

const REQUEST_ID = '9b0c5d1e-4f7a-4c2b-8e61-0d3a7f5c2b19';
const RUTH = { name: 'Ruth Adeyemi', email: 'ruth.adeyemi@gracepoint.ca' };

/**
 * L2-092.1: a job that keeps failing moves to the failed-jobs store after its 6th attempt, and the
 * failure is reported to error tracking and raised to the on-call person with the job's name and the
 * request that queued it (operations/run-background-jobs, operations/monitor-health-and-errors).
 */
describe('background job failure', () => {
  beforeAll(async () => {
    await freshDatabase({ seed: false });
  });

  afterAll(() => {
    delete process.env.APP_RELEASE;
    reloadConfig();
    return closeDatabase();
  });

  beforeEach(async () => {
    await freshDatabase({ seed: false });
    resetClock();
    process.env.APP_RELEASE = '2026.10.09-1';
    reloadConfig();
    holdJobs();
  });

  it('moves a job that fails six times to the failed-jobs store', async () => {
    failTheMailTransport();
    await queueVerificationEmailDuringARequest();

    expect(await workUntilTheQueueIsEmpty('notifications')).toBe(6);

    const [failed, ...rest] = failedJobs();
    expect(rest).toHaveLength(0);
    expect(failed?.id).toMatch(UUID);
    expect(failed?.queue).toBe('notifications');
    expect(failed?.name).toBe(SEND_EMAIL_JOB);
    expect(failed?.attempts).toBe(6);
    expect(failed?.exception).toContain('MailTransportError');
  });

  it('reports the failure with the job name, request id and release', async () => {
    failTheMailTransport();
    await queueVerificationEmailDuringARequest();

    await workUntilTheQueueIsEmpty('notifications');

    const [report, ...rest] = errorReports();
    expect(rest).toHaveLength(0);
    expect(report?.error.name).toBe('MailTransportError');
    expect(report?.requestId).toBe(REQUEST_ID);
    expect(report?.release).toBe('2026.10.09-1');
    expect(report?.context.job).toBe(SEND_EMAIL_JOB);
    expect(report?.context.queue).toBe('notifications');
    expect(report?.context.attempts).toBe(6);
  });

  it('alerts the on-call person once with the job name and request id', async () => {
    failTheMailTransport();
    await queueVerificationEmailDuringARequest();

    await workUntilTheQueueIsEmpty('notifications');

    const [alert, ...rest] = alerts();
    expect(rest).toHaveLength(0);
    expect(alert?.key).toBe('job-failed');
    expect(alert?.severity).toBe(AlertSeverity.Critical);
    expect(alert?.summary).toContain(SEND_EMAIL_JOB);
    expect(alert?.summary).toContain(REQUEST_ID);
    expect(alert?.context.requestId).toBe(REQUEST_ID);
  });

  it('neither stores nor reports a job that succeeds on a retry', async () => {
    failTheMailTransport();
    await queueVerificationEmailDuringARequest();
    await workNextJob('notifications');
    restoreTheMailTransport();
    travel({ seconds: (queuedJob()?.availableAt.toSeconds() ?? 0) - now().toSeconds() });

    await workNextJob('notifications');

    expect(queuedJob()).toBeUndefined();
    expect(failedJobs()).toEqual([]);
    expect(errorReports()).toEqual([]);
    expect(alerts()).toEqual([]);
    expect(sentEmails()).toHaveLength(1);
  });

  it('records what the fakes are sent after redaction', () => {
    errorReporter().report(new Error('Card 4242 4242 4242 4242 declined'), REQUEST_ID, 'dev', {
      job: 'payments.charge-balance',
      password: 'hosanna-in-the-highest',
      note: 'card 4242 4242 4242 4242',
    });

    const [report] = errorReports();
    expect(report?.context.password).toBe('[REDACTED]');
    expect(report?.context.note).toBe('card …4242');
    expect(report?.context.job).toBe('payments.charge-balance');
  });

  /** The worker is another process: it knows the request only from the job's payload. */
  function queueVerificationEmailDuringARequest(): Promise<void> {
    return runWithRequestContext({ requestId: REQUEST_ID, session: undefined, user: null }, () =>
      sendVerifyEmail(RUTH, 'plain-token', '/'),
    );
  }
});
