import { sql } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { issuePasswordResetToken } from '@/server/actions/accounts/issue-password-reset-token';
import { db } from '@/server/db/client';
import { Browser, CAST_PASSWORD, NAOMI } from '../../support/accounts';
import { travel, travelTo } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { emailsTo, onlySentEmail, sentEmails } from '../../support/mail';

const FORGOT = { method: 'post', path: '/password/forgot' };
const CHECK = { method: 'post', path: '/password/reset/check' };
const RESET = { method: 'post', path: '/password/reset' };
const NEW_PASSWORD = 'a-song-of-ascents-121';

/**
 * L2-023.3: asking for a reset always gets the same answer, and the link works once, for 60 minutes.
 * L2-023.4: a reset ends every other session, and this browser is signed in. L2-072.1: the new
 * password follows the policy. L2-077.4: asking for a link needs a passing bot check. Limits: 5 links
 * an hour per address and per email, 30 resets a minute per address (M2 D6).
 */
describe('password reset', () => {
  let naomiId: number;
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    travelTo('2026-10-09 10:31');
    const [naomi] = await query<{ id: number }>(sql`select id from users where email = ${NAOMI}`);
    naomiId = naomi?.id ?? 0;
    browser = await fresh();
  });

  it('answers 202 to a request for a link and emails one that works for 60 minutes', async () => {
    const response = await forgot(NAOMI);

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { email: NAOMI } });
    expectContract(response, FORGOT, { data: { email: NAOMI } });
    const email = onlySentEmail();
    expect(email.to.address).toBe(NAOMI);
    expect(email.subject).toBe('Reset your Zamaro password');
    expect(email.html).not.toBe('');
    expect(email.text).toContain('Hi Naomi,');
    const link = new RegExp(`${escapeRegExp(config().webUrl)}/reset-password/([A-Za-z0-9]+)`).exec(
      email.text,
    );
    expect(link, 'The text part holds the reset link.').not.toBeNull();
    const [token] = await query<{ user_id: number; expires_at: string }>(
      sql`select user_id, expires_at from password_reset_tokens where token_hash = ${await sha256(link?.[1] ?? '')}`,
    );
    expect(token, 'Only the token SHA-256 is stored.').toBeDefined();
    expect(token?.user_id).toBe(naomiId);
    expect(new Date(token?.expires_at ?? 0).toISOString()).toBe('2026-10-09T15:31:00.000Z');
  });

  it('gives an address with no account the same answer and sends nothing', async () => {
    const nobody = await forgot('nobody@gracepoint.ca');
    expect(nobody.status).toBe(202);
    expect(await nobody.json()).toEqual({ data: { email: 'nobody@gracepoint.ca' } });
    const anyCase = await forgot('Naomi.Fraser@RiversideCC.ca');
    expect(anyCase.status).toBe(202);
    expect(await anyCase.json()).toEqual({ data: { email: NAOMI } });

    expect(sentEmails().map((email) => email.to.address)).toEqual([NAOMI]);
    expect(await query(sql`select id from password_reset_tokens`)).toHaveLength(1);
  });

  it('sends nothing after a failed bot check', async () => {
    const response = await forgot(NAOMI, 'fail');

    expect(response.status).toBe(422);
    expect(((await response.json()) as { errors: object }).errors).toHaveProperty('challengeToken');
    expect(sentEmails()).toEqual([]);
  });

  it('replaces the earlier link with a new one', async () => {
    const earlier = await issueToken();

    expect((await forgot(NAOMI)).status).toBe(202);

    expect((await check(earlier)).status).toBe(410);
  });

  it('refuses the 6th link in an hour from one address or for one email', async () => {
    for (let i = 1; i <= 5; i++) {
      expect((await forgot(`someone${String(i)}@gracepoint.ca`)).status).toBe(202);
    }
    const response = await forgot('someone6@gracepoint.ca');
    expect(response.status).toBe(429);
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/too-many-requests`);
    expectContract(response, FORGOT, body);

    for (let i = 1; i <= 5; i++) {
      browser = await fresh(`203.0.113.${String(i)}`);
      expect((await forgot(NAOMI)).status, `address ${String(i)}`).toBe(202);
    }
    browser = await fresh('203.0.113.99');
    expect((await forgot(NAOMI)).status).toBe(429);
  });

  it('names the account and when the link runs out on a check, without using it', async () => {
    const token = await issueToken();

    const response = await check(token);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { email: string; expiresAt: string } };
    expect(body.data.email).toBe(NAOMI);
    expect(new Date(body.data.expiresAt).toISOString()).toBe('2026-10-09T15:31:00.000Z');
    expectContract(response, CHECK, body);
    expect((await check(token)).status).toBe(200);
  });

  it('treats an unknown link as expired and names no one', async () => {
    const response = await check('e2e-unknown');

    expect(response.status).toBe(410);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.type).toBe(`${config().problemsBaseUri}/link-expired`);
    expect(body).not.toHaveProperty('email');
    expectContract(response, CHECK, body);
  });

  it('lets a link work for 60 minutes, then names its account and when it was sent', async () => {
    const token = await issueToken();

    travel({ minutes: 59 });
    expect((await check(token)).status).toBe(200);
    travel({ minutes: 2 });

    const response = await check(token);
    expect(response.status).toBe(410);
    const body = (await response.json()) as { email: string; sentAt: string };
    expect(body.email).toBe(NAOMI);
    expect(new Date(body.sentAt).toISOString()).toBe('2026-10-09T14:31:00.000Z');
    expect((await reset(token)).status).toBe(410);
    expect(await verify(await password(), CAST_PASSWORD)).toBe(true);
  });

  it('signs this browser in with the new password and uses the link up', async () => {
    const token = await issueToken();

    const response = await reset(token);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { email: string } };
    expect(body.data.email).toBe(NAOMI);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, RESET, body);
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(200);
    expect(await verify(await password(), NEW_PASSWORD)).toBe(true);
    expect((await password()).startsWith('$argon2id$')).toBe(true);
    expect(emailsTo(NAOMI).map((email) => email.subject)).toEqual([
      'Your Zamaro password was changed',
    ]);
    const audit = await query(
      sql`select id from audit_entries where action = 'auth.password_reset' and actor_id = ${naomiId}`,
    );
    expect(audit).toHaveLength(1);
    browser = await fresh();
    expect((await reset(token)).status).toBe(410);
  });

  it('ends every other session', async () => {
    const elsewhere = new Browser();
    expect((await elsewhere.signIn(NAOMI)).status).toBe(200);
    expect((await elsewhere.json('/api/v1/me', 'GET')).status).toBe(200);
    const token = await issueToken();

    expect((await reset(token)).status).toBe(200);

    expect((await elsewhere.json('/api/v1/me', 'GET')).status).toBe(401);
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(200);
    const sessions = await query(sql`select id from user_sessions where user_id = ${naomiId}`);
    expect(sessions).toHaveLength(1);
  });

  it('sends the password-changed email to the account', async () => {
    expect((await reset(await issueToken())).status).toBe(200);

    const email = onlySentEmail();
    expect(email.to.address).toBe(NAOMI);
    expect(email.subject).toBe('Your Zamaro password was changed');
    expect(email.text).toContain(`${config().webUrl}/forgot-password`);
  });

  it('needs a new password that follows the policy and matches its confirmation', async () => {
    const token = await issueToken();

    const short = await reset(token, { password: 'grace2026', passwordConfirmation: 'grace2026' });
    expect(short.status).toBe(422);
    expect(((await short.json()) as { errors: object }).errors).toHaveProperty('password');
    const breached = await reset(token, {
      password: 'password1234',
      passwordConfirmation: 'password1234',
    });
    expect(breached.status).toBe(422);
    expect(
      ((await breached.json()) as { errors: Record<string, string[]> }).errors.password?.[0],
    ).toBe('This password appears in a known data breach. Choose another.');
    const mismatch = await reset(token, { passwordConfirmation: 'a-song-of-ascents-12l' });
    expect(mismatch.status).toBe(422);
    const body = (await mismatch.json()) as { errors: object };
    expect(body.errors).toHaveProperty('passwordConfirmation');
    expectContract(mismatch, RESET, body);

    expect((await reset(token)).status).toBe(200);
  });

  it('refuses the 31st reset in a minute from one address', async () => {
    for (let i = 1; i <= 30; i++) {
      expect((await check('e2e-unknown')).status, `check ${String(i)}`).toBe(410);
    }

    expect((await reset('e2e-unknown')).status).toBe(429);
  });

  function issueToken(): Promise<string> {
    return db().transaction((tx) => issuePasswordResetToken(tx, naomiId));
  }

  async function fresh(address?: string): Promise<Browser> {
    const next = new Browser();
    next.address = address;
    await next.request('/api/v1/csrf-cookie');
    return next;
  }

  function forgot(email: string, challengeToken = 'pass'): Promise<Response> {
    return browser.json('/api/v1/password/forgot', 'POST', { email, challengeToken });
  }

  function check(token: string): Promise<Response> {
    return browser.json('/api/v1/password/reset/check', 'POST', { token });
  }

  function reset(token: string, overrides: Record<string, string> = {}): Promise<Response> {
    return browser.json('/api/v1/password/reset', 'POST', {
      token,
      password: NEW_PASSWORD,
      passwordConfirmation: NEW_PASSWORD,
      ...overrides,
    });
  }

  async function password(): Promise<string> {
    const [row] = await query<{ password: string }>(
      sql`select password from users where id = ${naomiId}`,
    );
    return row?.password ?? '';
  }
});

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
