import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { castBooker } from '@/cli/cast-booker';
import { Browser, CAST_PASSWORD, freshBooker, NAOMI, signedIn } from '../../support/accounts';
import { resetClock, travel } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { emailsTo, sentEmails } from '../../support/mail';

const ASK = { method: 'put', path: '/account/email' };
const CONFIRM = { method: 'post', path: '/account/email/confirm' };
const NEW_EMAIL = 'ruth@gracepoint.ca';

interface UserRow extends Record<string, unknown> {
  email: string;
  pending_email: string | null;
  email_verified_at: string | null;
}

/**
 * L2-025.1 (accounts/manage-account-settings): a new email, confirmed with the current password,
 * takes over only once the link sent to it is opened; the old address is told. An address another
 * account uses gets the same answer and no link. The link works once, for 24 hours (M2 D11).
 */
describe('changing the account email', () => {
  let email: string;
  let userId: number;
  let browser: Browser;

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
    browser = await signedIn(email);
  });

  it('sends a link to the new address and a notice to the old one', async () => {
    const response = await ask('Ruth@GracePoint.ca');

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { email: NEW_EMAIL } });
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, ASK, { data: { email: NEW_EMAIL } });
    const user = await ruth();
    expect(user?.email, 'The address changes only once the link is opened.').toBe(email);
    expect(user?.pending_email).toBe(NEW_EMAIL);

    const link = lastEmailTo(NEW_EMAIL);
    expect(link.subject).toBe('Confirm your new email for Zamaro');
    expect(link.html).not.toBe('');
    const token = tokenIn(link.text);
    const [row] = await query<{ new_email: string; expires_at: string }>(
      sql`select new_email, expires_at from email_change_tokens where token_hash = ${await sha256(token)}`,
    );
    expect(row, 'Only the token SHA-256 is stored.').toBeDefined();
    expect(row?.new_email).toBe(NEW_EMAIL);
    expect(new Date(row?.expires_at ?? 0).toISOString()).toBe('2026-10-10T14:00:00.000Z');

    const notice = lastEmailTo(email);
    expect(notice.subject).toBe('Your Zamaro email is changing');
    expect(notice.text).toContain(NEW_EMAIL);
  });

  it('moves the account to the new address when the link is opened', async () => {
    expect((await ask(NEW_EMAIL)).status).toBe(202);
    const token = tokenIn(lastEmailTo(NEW_EMAIL).text);

    const response = await confirm(token, new Browser());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { email: NEW_EMAIL } });
    expectContract(response, CONFIRM, { data: { email: NEW_EMAIL } });
    const user = await ruth();
    expect(user?.email).toBe(NEW_EMAIL);
    expect(user?.pending_email).toBeNull();
    expect(user?.email_verified_at).not.toBeNull();
    const audit = await query(
      sql`select id from audit_entries where action = 'account.email_changed' and actor_id = ${userId}`,
    );
    expect(audit).toHaveLength(1);
    expect((await new Browser().signIn(NEW_EMAIL)).status).toBe(200);
  });

  it('lets the link work once and for 24 hours', async () => {
    expect((await ask(NEW_EMAIL)).status).toBe(202);
    const token = tokenIn(lastEmailTo(NEW_EMAIL).text);
    travel({ minutes: 24 * 60 + 1 });

    const response = await confirm(token);

    expect(response.status).toBe(410);
    const body = (await response.json()) as { type: string; email: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/link-expired`);
    expect(body.email).toBe(email);
    expectContract(response, CONFIRM, body);
    expect((await ruth())?.email).toBe(email);
  });

  it('treats a used or unknown link as expired', async () => {
    expect((await ask(NEW_EMAIL)).status).toBe(202);
    const token = tokenIn(lastEmailTo(NEW_EMAIL).text);
    expect((await confirm(token)).status).toBe(200);

    const used = await confirm(token);
    expect(used.status).toBe(410);
    expect(((await used.json()) as { email: string }).email).toBe(NEW_EMAIL);
    const unknown = await confirm('e2e-unknown');
    expect(unknown.status).toBe(410);
    expect(await unknown.json()).not.toHaveProperty('email');
  });

  it('replaces the earlier link with a new request', async () => {
    expect((await ask(NEW_EMAIL)).status).toBe(202);
    const earlier = tokenIn(lastEmailTo(NEW_EMAIL).text);

    expect((await ask('ruth.okafor@gracepoint.ca')).status).toBe(202);

    expect((await confirm(earlier)).status).toBe(410);
    expect((await ruth())?.pending_email).toBe('ruth.okafor@gracepoint.ca');
  });

  it('gives an address another account uses the same answer and no link', async () => {
    const response = await ask(NAOMI);

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { email: NAOMI } });
    expect(sentEmails().map((message) => message.to.address)).toEqual([email]);
    expect((await ruth())?.pending_email).toBeNull();
    expect(await query(sql`select id from email_change_tokens`)).toEqual([]);
  });

  it('does not move to an address taken after the link was sent', async () => {
    expect((await ask(NEW_EMAIL)).status).toBe(202);
    const token = tokenIn(lastEmailTo(NEW_EMAIL).text);
    await castBooker(NEW_EMAIL);

    expect((await confirm(token)).status).toBe(410);

    expect((await ruth())?.email).toBe(email);
  });

  it('refuses a wrong current password or a bad address and sends nothing', async () => {
    const wrong = await ask(NEW_EMAIL, 'not-my-password');
    expect(wrong.status).toBe(422);
    expect(
      ((await wrong.json()) as { errors: Record<string, string[]> }).errors.currentPassword?.[0],
    ).toBe('That password isn’t right. Check it and try again.');
    const bad = await ask('ruth@gracepoint');
    expect(bad.status).toBe(422);
    expect(((await bad.json()) as { errors: object }).errors).toHaveProperty('email');
    const same = await ask(email);
    expect(same.status).toBe(422);
    expect(((await same.json()) as { errors: object }).errors).toHaveProperty('email');

    expect(sentEmails()).toEqual([]);
    expect((await ruth())?.pending_email).toBeNull();
  });

  it('refuses a guest', async () => {
    const guest = new Browser();
    await guest.request('/api/v1/csrf-cookie');

    const response = await guest.json('/api/v1/account/email', 'PUT', {
      email: NEW_EMAIL,
      currentPassword: 'x',
    });

    expect(response.status).toBe(401);
  });

  function ask(address: string, currentPassword: string = CAST_PASSWORD): Promise<Response> {
    return browser.json('/api/v1/account/email', 'PUT', { email: address, currentPassword });
  }

  async function confirm(token: string, from?: Browser): Promise<Response> {
    const client = from ?? browser;
    if (from !== undefined) await from.request('/api/v1/csrf-cookie');
    return client.json('/api/v1/account/email/confirm', 'POST', { token });
  }

  async function ruth(): Promise<UserRow | undefined> {
    const [row] = await query<UserRow>(
      sql`select email, pending_email, email_verified_at from users where id = ${userId}`,
    );
    return row;
  }

  function lastEmailTo(address: string): { subject: string; html: string; text: string } {
    const sent = emailsTo(address);
    expect(sent.length, `An email went to ${address}.`).toBeGreaterThan(0);
    const last = sent[sent.length - 1];
    if (last === undefined) throw new Error(`No email went to ${address}.`);
    return last;
  }

  function tokenIn(text: string): string {
    const link = new RegExp(
      `${escapeRegExp(config().webUrl)}/account/email/confirm\\?token=([A-Za-z0-9]+)`,
    ).exec(text);
    expect(link, 'The text part holds the confirmation link.').not.toBeNull();
    return link?.[1] ?? '';
  }
});

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
