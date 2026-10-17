import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { logger } from '@/server/support/logger';
import { captureLogs } from '../../support/logs';

/**
 * L2-079.3: passwords, tokens, session IDs and payment identifiers beyond the last 4 digits never
 * reach the logs, whichever line writes them (security/protect-secrets-and-data).
 */
describe('log redaction', () => {
  let logs: ReturnType<typeof captureLogs>;

  beforeAll(() => {
    logs = captureLogs();
  });

  afterAll(() => {
    logs.restore();
  });

  it('redacts passwords, tokens and session ids at any depth', () => {
    logger().warn(
      {
        password: 'hosanna-in-the-highest',
        form: {
          current_password: 'old-hymn-1984',
          password_confirmation: 'hosanna-in-the-highest',
          challengeToken: 'cf-challenge-7f3a',
        },
        headers: {
          'X-XSRF-TOKEN': 'eyJpdiI6xsrf',
          Cookie: 'zamaro_session=abc123',
          Authorization: 'Bearer t0k3n',
        },
        remember_token: 'remember-me-42',
        session_id: 'sess-9b2c',
        email: 'naomi.fraser@riversidecc.ca',
      },
      'sign-in failed',
    );

    const line = onlyLine('sign-in failed');
    expect(line.password).toBe('[REDACTED]');
    expect((line.form as Record<string, unknown>).current_password).toBe('[REDACTED]');
    expect((line.form as Record<string, unknown>).challengeToken).toBe('[REDACTED]');
    expect((line.headers as Record<string, unknown>)['X-XSRF-TOKEN']).toBe('[REDACTED]');
    expect(line.session_id).toBe('[REDACTED]');
    expect(line.email).toBe('naomi.fraser@riversidecc.ca');
    const text = JSON.stringify(logs.lines());
    for (const secret of [
      'hosanna-in-the-highest',
      'old-hymn-1984',
      'cf-challenge-7f3a',
      'eyJpdiI6xsrf',
      'abc123',
      't0k3n',
      'remember-me-42',
      'sess-9b2c',
    ]) {
      expect(text, secret).not.toContain(secret);
    }
  });

  it('keeps only the last 4 digits of payment identifiers and card numbers', () => {
    logger().info(
      { processor_payment_id: 'pi_3NxK2a8842', note: 'card 4242 4242 4242 4242 declined' },
      'payout',
    );

    const line = onlyLine('payout');
    expect(line.processor_payment_id).toBe('…8842');
    expect(line.note).toBe('card …4242 declined');
  });

  it('redacts message bodies', () => {
    logger().info({ body: 'Call me on 905-555-0123' }, 'message sent');

    expect(onlyLine('message sent').body).toBe('[REDACTED]');
  });

  function onlyLine(msg: string): Record<string, unknown> {
    const lines = logs.lines().filter((line) => line.msg === msg);
    expect(lines).toHaveLength(1);
    return lines[0] ?? {};
  }
});
