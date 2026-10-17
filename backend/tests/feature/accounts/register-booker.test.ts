import { sql } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { Browser, NAOMI } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { emailsTo, onlySentEmail, sentEmails } from '../../support/mail';

const REGISTER = { method: 'post', path: '/register' };
const EMAIL = 'ruth.adeyemi@gracepoint.ca';
const VERIFY_SUBJECT = 'Verify your email for Zamaro';
const DUPLICATE_SUBJECT = 'Someone tried to sign up with your email';

/**
 * L2-022.1–.2: a guest registers as a booker and is sent a verification link; an address that already
 * has an account gets the same answer, and its owner is told instead. L2-072.1–.2: passwords of 12 to
 * 128 characters, not in a known breach, stored as Argon2id (accounts/register-booker).
 */
describe('register a booker', () => {
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');
  });

  it('registers a guest as a booker and sends a verification link', async () => {
    const response = await register();

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { email: EMAIL } });
    expectContract(response, REGISTER, { data: { email: EMAIL } });
    const [user] = await query<{
      id: number;
      name: string;
      email_verified_at: string | null;
      password: string;
    }>(sql`select id, name, email_verified_at, password from users where email = ${EMAIL}`);
    expect(user?.name).toBe('Ruth Adeyemi');
    expect(user?.email_verified_at).toBeNull();
    expect(user?.password.startsWith('$argon2id$')).toBe(true);
    expect(await verify(user?.password ?? '', 'hosanna-in-the-highest')).toBe(true);
    const roles = await query<{ name: string }>(
      sql`select r.name from roles r join role_user ru on ru.role_id = r.id where ru.user_id = ${user?.id ?? 0}`,
    );
    expect(roles.map((role) => role.name)).toEqual(['booker']);
    expect(emailsTo(EMAIL).map((message) => message.subject)).toEqual([VERIFY_SUBJECT]);
  });

  it('does not sign the guest in', async () => {
    expect((await register()).status).toBe(202);

    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(401);
  });

  it('sends a verification email with both parts and a 24-hour link to the web app', async () => {
    const response = await register({ returnUrl: '/artists/abigail-mensah?date=2026-11-14' });
    expect(response.status).toBe(202);

    const email = onlySentEmail();
    expect(email.from).toEqual({ name: 'Zamaro', address: 'hello@zamaro.ca' });
    expect(email.to.address).toBe(EMAIL);
    expect(email.subject).toBe(VERIFY_SUBJECT);
    expect(email.html).not.toBe('');
    expect(email.text).toContain('Hi Ruth,');
    const link = new RegExp(
      `${escapeRegExp(config().webUrl)}/verify-email\\?token=([A-Za-z0-9]+)&returnUrl=(\\S+)`,
    ).exec(email.text);
    expect(link, 'The text part holds the verification link.').not.toBeNull();
    expect(decodeURIComponent(link?.[2] ?? '')).toBe('/artists/abigail-mensah?date=2026-11-14');
    expect(email.html).toContain((link?.[0] ?? 'the link').replace(/&/g, '&amp;'));
    const hash = await sha256(link?.[1] ?? '');
    const [token] = await query<{ user_id: number; expires_at: string; used_at: string | null }>(
      sql`select user_id, expires_at, used_at from email_verification_tokens where token_hash = ${hash}`,
    );
    expect(token, 'Only the token SHA-256 is stored.').toBeDefined();
    const [user] = await query<{ id: number }>(sql`select id from users where email = ${EMAIL}`);
    expect(token?.user_id).toBe(user?.id);
    expect(new Date(token?.expires_at ?? 0).toISOString()).toBe('2026-10-10T14:00:00.000Z');
    expect(token?.used_at).toBeNull();
  });

  it('gives an address with an account the same answer and tells its owner', async () => {
    const before = await naomi();
    const usersBefore = await count('users');
    const consentsBefore = await count('consent_records');

    const response = await register({ email: 'Naomi.Fraser@RiversideCC.ca', name: 'Someone Else' });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { email: NAOMI } });
    expect(await count('users')).toBe(usersBefore);
    expect(await naomi()).toEqual(before);
    expect(await count('consent_records')).toBe(consentsBefore);
    expect(sentEmails().map((message) => [message.to.address, message.subject])).toEqual([
      [NAOMI, DUPLICATE_SUBJECT],
    ]);
  });

  it('emails the owner that someone tried to sign up with their email', async () => {
    expect((await register({ email: NAOMI })).status).toBe(202);

    const email = onlySentEmail();
    expect(email.to.address).toBe(NAOMI);
    expect(email.subject).toBe(DUPLICATE_SUBJECT);
    expect(email.html).not.toBe('');
    expect(email.text).toContain('Fri 9 Oct 2026');
    expect(email.text).toContain(`${config().webUrl}/sign-in`);
  });

  it('refuses a password under 12 characters', async () => {
    const response = await register({ password: 'grace2026' });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.password).toEqual(['This one has 9 characters. Use at least 12.']);
    expectContract(response, REGISTER, body);
    expect(await ruthExists()).toBe(false);
  });

  it('accepts a password of 12 or 128 characters and refuses 129', async () => {
    const twelve = await register({ email: 'twelve@gracepoint.ca', password: 'g'.repeat(12) });
    expect(twelve.status).toBe(202);
    const long = await register({ email: 'long@gracepoint.ca', password: 'g'.repeat(128) });
    expect(long.status).toBe(202);

    const response = await register({ email: 'too-long@gracepoint.ca', password: 'g'.repeat(129) });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.password).toEqual(['This one has 129 characters. Use at most 128.']);
  });

  it('refuses a password found in a known breach with the reason', async () => {
    const response = await register({ password: 'password1234' });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.password?.[0]).toBe(
      'This password appears in a known data breach. Choose another.',
    );
    expect(await ruthExists()).toBe(false);
  });

  it('needs the terms accepted', async () => {
    for (const acceptedTerms of [false, undefined]) {
      const response = await register({ acceptedTerms });

      expect(response.status).toBe(422);
      const body = (await response.json()) as { errors: Record<string, string[]> };
      expect(body.errors.acceptedTerms).toEqual([
        'Accept the terms and privacy policy to create an account.',
      ]);
    }
    expect(await ruthExists()).toBe(false);
  });

  it('needs a name and a valid email', async () => {
    const noName = await register({ name: '  ' });
    expect(noName.status).toBe(422);
    expect(((await noName.json()) as { errors: object }).errors).toHaveProperty('name');

    const badEmail = await register({ email: 'not-an-email' });
    expect(badEmail.status).toBe(422);
    expect(((await badEmail.json()) as { errors: object }).errors).toHaveProperty('email');
  });

  it('refuses the 11th registration in an hour from one address', async () => {
    for (let i = 1; i <= 10; i++) {
      const response = await register({ email: `booker${String(i)}@gracepoint.ca` });
      expect(response.status, `registration ${String(i)}`).toBe(202);
    }

    const response = await register({ email: 'booker11@gracepoint.ca' });

    expect(response.status).toBe(429);
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/too-many-requests`);
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
    expectContract(response, REGISTER, body);
  });

  function register(overrides: Record<string, unknown> = {}): Promise<Response> {
    return browser.json('/api/v1/register', 'POST', {
      name: 'Ruth Adeyemi',
      email: EMAIL,
      password: 'hosanna-in-the-highest',
      acceptedTerms: true,
      marketingOptIn: false,
      termsVersion: '2026-10',
      privacyPolicyVersion: '2026-10',
      challengeToken: 'pass',
      ...overrides,
    });
  }

  async function count(table: 'users' | 'consent_records'): Promise<number> {
    const [row] = await query<{ total: number }>(
      sql`select count(*)::int as total from ${sql.identifier(table)}`,
    );
    return row?.total ?? 0;
  }

  async function ruthExists(): Promise<boolean> {
    return (await query(sql`select id from users where email = ${EMAIL}`)).length > 0;
  }

  function naomi(): Promise<Record<string, unknown>[]> {
    return query(sql`select name, password, email_verified_at from users where email = ${NAOMI}`);
  }
});

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
