import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Browser, CAST_PASSWORD, freshBooker, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { emailsTo } from '../../support/mail';

const CHANGE = { method: 'put', path: '/account/password' };
const NEW_PASSWORD = 'a-song-of-ascents-121';

/**
 * L2-025.2 (accounts/manage-account-settings): a new password, given the current one, ends every
 * other session and gives this one a new ID. L2-072.1: it follows the password policy.
 */
describe('changing the password', () => {
  let email: string;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    email = await freshBooker();
  });

  it('ends every other session and renews this one', async () => {
    const elsewhere = await signedIn(email);
    const here = await signedIn(email);
    const before = here.cookie('zamaro_session');

    const response = await change(here);

    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, CHANGE, null);
    expect(here.cookie('zamaro_session')).toBeDefined();
    expect(here.cookie('zamaro_session')).not.toBe(before);
    expect((await elsewhere.json('/api/v1/me', 'GET')).status).toBe(401);
    expect((await withCookie(before ?? '').json('/api/v1/me', 'GET')).status).toBe(401);
    expect((await here.json('/api/v1/me', 'GET')).status).toBe(200);
    const sessions = await query(
      sql`select s.id from user_sessions s join users u on u.id = s.user_id where u.email = ${email}`,
    );
    expect(sessions).toHaveLength(1);
  });

  it('signs in with the new password and not the old one', async () => {
    const browser = await signedIn(email);

    expect((await change(browser)).status).toBe(204);

    expect((await new Browser().signIn(email)).status).toBe(422);
    expect((await new Browser().signIn(email, NEW_PASSWORD)).status).toBe(200);
    const audit = await query(
      sql`select a.id from audit_entries a join users u on u.id = a.actor_id
          where a.action = 'auth.password_changed' and u.email = ${email}`,
    );
    expect(audit).toHaveLength(1);
  });

  it('emails the owner that the password changed', async () => {
    const browser = await signedIn(email);

    expect((await change(browser)).status).toBe(204);

    expect(emailsTo(email).map((message) => message.subject)).toEqual([
      'Your Zamaro password was changed',
    ]);
  });

  it('changes nothing on a wrong current password', async () => {
    const browser = await signedIn(email);

    const response = await change(browser, { currentPassword: 'not-my-password' });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.currentPassword?.[0]).toBe(
      'That password isn’t right. Check it and try again.',
    );
    expectContract(response, CHANGE, body);
    expect((await new Browser().signIn(email)).status).toBe(200);
  });

  it('needs a new password that follows the policy and matches its confirmation', async () => {
    const browser = await signedIn(email);

    const short = await change(browser, {
      password: 'grace2026',
      passwordConfirmation: 'grace2026',
    });
    expect(short.status).toBe(422);
    expect(
      ((await short.json()) as { errors: Record<string, string[]> }).errors.password?.[0],
    ).toBe('This one has 9 characters. Use at least 12.');
    const mismatch = await change(browser, { passwordConfirmation: 'a-song-of-ascents-12l' });
    expect(mismatch.status).toBe(422);
    expect(((await mismatch.json()) as { errors: object }).errors).toHaveProperty(
      'passwordConfirmation',
    );
  });

  it('gives a guest 401', async () => {
    const guest = new Browser();
    await guest.request('/api/v1/csrf-cookie');

    expect((await guest.json('/api/v1/account/password', 'PUT', {})).status).toBe(401);
  });

  function change(browser: Browser, overrides: Record<string, string> = {}): Promise<Response> {
    return browser.json('/api/v1/account/password', 'PUT', {
      currentPassword: CAST_PASSWORD,
      password: NEW_PASSWORD,
      passwordConfirmation: NEW_PASSWORD,
      ...overrides,
    });
  }

  function withCookie(sessionId: string): Browser {
    const browser = new Browser();
    browser.cookies.set('zamaro_session', sessionId);
    return browser;
  }
});
