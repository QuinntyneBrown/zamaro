import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { issuePasswordResetToken } from '@/server/actions/accounts/issue-password-reset-token';
import { db } from '@/server/db/client';
import { Browser, freshBooker, signedIn } from '../../support/accounts';
import { resetClock, travel } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { currentCode, turnOnTwoFactor } from '../../support/two-factor';

const SESSION = { method: 'post', path: '/session' };
const CHALLENGE = { method: 'post', path: '/session/two-factor' };

/**
 * L2-072.3–.4 (accounts/sign-in-and-recover-access): with two-step sign-in on, the right password
 * leads to a code, not a session. A current code, or an unused recovery code once, completes the
 * sign-in. Wrong codes share the 5-in-15-minutes lockout with wrong passwords.
 */
describe('the two-step sign-in challenge', () => {
  let email: string;
  let userId: number;
  let secret: string;
  let recoveryCodes: string[];

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    email = await freshBooker();
    const [row] = await query<{ id: number }>(sql`select id from users where email = ${email}`);
    userId = row?.id ?? 0;
    ({ secret, recoveryCodes } = await turnOnTwoFactor(await signedIn(email)));
  });

  it('asks for a code after the right password and signs no one in', async () => {
    const browser = new Browser();

    const response = await browser.signIn(email);

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { twoFactorRequired: true, email } });
    expectContract(response, SESSION, { data: { twoFactorRequired: true, email } });
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(401);
  });

  it('completes the sign-in with a current code', async () => {
    const browser = new Browser();
    expect((await browser.signIn(email)).status).toBe(202);
    const before = browser.cookie('zamaro_session');

    const response = await browser.json('/api/v1/session/two-factor', 'POST', {
      code: currentCode(secret),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { email: string; mfaEnabled: boolean } };
    expect(body.data.email).toBe(email);
    expect(body.data.mfaEnabled).toBe(true);
    expectContract(response, CHALLENGE, body);
    expect(browser.cookie('zamaro_session'), 'The session gets a new ID once signed in.').not.toBe(
      before,
    );
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(200);
    const audit = await query(
      sql`select id from audit_entries where action = 'auth.sign_in' and actor_id = ${userId}`,
    );
    expect(audit).toHaveLength(1);
  });

  it('refuses a wrong code and keeps the challenge open', async () => {
    const browser = new Browser();
    expect((await browser.signIn(email)).status).toBe(202);

    const response = await browser.json('/api/v1/session/two-factor', 'POST', { code: '000000' });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.code?.[0]).toBe(
      'That code is wrong or has expired. Enter the code your app shows now.',
    );
    expectContract(response, CHALLENGE, body);
    const right = await browser.json('/api/v1/session/two-factor', 'POST', {
      code: currentCode(secret),
    });
    expect(right.status).toBe(200);
  });

  it('lets a recovery code work once', async () => {
    const browser = new Browser();
    expect((await browser.signIn(email)).status).toBe(202);
    const shouted = (recoveryCodes[3] ?? '').replace('-', '').toUpperCase();

    expect(
      (await browser.json('/api/v1/session/two-factor', 'POST', { recoveryCode: shouted })).status,
    ).toBe(200);

    const again = new Browser();
    expect((await again.signIn(email)).status).toBe(202);
    const used = await again.json('/api/v1/session/two-factor', 'POST', {
      recoveryCode: recoveryCodes[3],
    });
    expect(used.status).toBe(422);
    expect(
      ((await used.json()) as { errors: Record<string, string[]> }).errors.recoveryCode?.[0],
    ).toBe('That recovery code is wrong or was used. Enter another of your saved codes.');
    const next = await again.json('/api/v1/session/two-factor', 'POST', {
      recoveryCode: recoveryCodes[4],
    });
    expect(next.status).toBe(200);
  });

  it('has no challenge without a password step', async () => {
    const browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');

    const response = await browser.json('/api/v1/session/two-factor', 'POST', {
      code: currentCode(secret),
    });

    expect(response.status).toBe(401);
  });

  it('lets the challenge last 10 minutes', async () => {
    const browser = new Browser();
    expect((await browser.signIn(email)).status).toBe(202);
    travel({ minutes: 11 });

    const response = await browser.json('/api/v1/session/two-factor', 'POST', {
      code: currentCode(secret),
    });

    expect(response.status).toBe(401);
  });

  it('shares the lockout between wrong codes and wrong passwords', async () => {
    for (let i = 0; i < 3; i++) {
      expect((await new Browser().signIn(email, 'not-my-password')).status).toBe(422);
    }
    const browser = new Browser();
    expect((await browser.signIn(email)).status).toBe(202);
    expect(
      (await browser.json('/api/v1/session/two-factor', 'POST', { code: '000000' })).status,
    ).toBe(422);
    expect(
      (await browser.json('/api/v1/session/two-factor', 'POST', { code: '000001' })).status,
    ).toBe(422);

    const response = await browser.json('/api/v1/session/two-factor', 'POST', {
      code: currentCode(secret),
    });

    expect(response.status).toBe(429);
    expect(((await response.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/sign-in-paused`,
    );
    expect((await new Browser().signIn(email)).status).toBe(429);
  });

  it('leads to the challenge after a password reset too', async () => {
    const token = await db().transaction((tx) => issuePasswordResetToken(tx, userId));
    const browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');

    const response = await browser.json('/api/v1/password/reset', 'POST', {
      token,
      password: 'a-song-of-ascents-121',
      passwordConfirmation: 'a-song-of-ascents-121',
    });

    expect(response.status).toBe(202);
    expect(
      ((await response.json()) as { data: { twoFactorRequired: boolean } }).data.twoFactorRequired,
    ).toBe(true);
    const completed = await browser.json('/api/v1/session/two-factor', 'POST', {
      code: currentCode(secret),
    });
    expect(completed.status).toBe(200);
  });
});
