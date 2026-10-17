import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { issueEmailVerificationToken } from '@/server/actions/accounts/issue-email-verification-token';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { Role } from '@/server/enums';
import { grantRoles } from '@/server/services/accounts/roles';
import { hashPassword } from '@/server/support/passwords';
import { Browser, CAST_PASSWORD, NAOMI } from '../../support/accounts';
import { resetClock, travel } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { emailsTo, sentEmails } from '../../support/mail';

const VERIFY = { method: 'post', path: '/email/verify' };
const RESEND = { method: 'post', path: '/email/verification-notification' };
const RUTH = 'ruth.adeyemi@gracepoint.ca';
const VERIFY_SUBJECT = 'Verify your email for Zamaro';

/**
 * L2-022.3: the verification link marks the address verified once, within 24 hours; after that, or
 * after one use, it has expired and a new link can be sent, which stops the earlier ones working
 * (accounts/register-booker; resend limit M2 D6).
 */
describe('verify the email address', () => {
  let ruthId: number;
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    const [row] = await db()
      .insert(users)
      .values({ name: 'Ruth Adeyemi', email: RUTH, password: await hashPassword(CAST_PASSWORD) })
      .returning({ id: users.id });
    ruthId = row?.id ?? 0;
    await grantRoles(db(), ruthId, [Role.Booker]);
    browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');
  });

  it('marks the address verified and names the person', async () => {
    const token = await issueToken();

    const response = await verify(token);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { name: 'Ruth Adeyemi' } });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expectContract(response, VERIFY, { data: { name: 'Ruth Adeyemi' } });
    expect(await verifiedAt()).toBe('2026-10-09T14:00:00.000Z');
    const [used] = await query<{ used_at: string | null }>(
      sql`select used_at from email_verification_tokens where user_id = ${ruthId}`,
    );
    expect(used?.used_at).not.toBeNull();
  });

  it('does not sign the person in', async () => {
    expect((await verify(await issueToken())).status).toBe(200);

    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(401);
  });

  it('lets a link work only once', async () => {
    const token = await issueToken();
    expect((await verify(token)).status).toBe(200);

    const response = await verify(token);

    expect(response.status).toBe(410);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string; title: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/link-expired`);
    expect(body.title).toBe('This link has expired');
    expectContract(response, VERIFY, body);
  });

  it('lets a link work for 24 hours', async () => {
    const token = await issueToken();

    travel({ minutes: 24 * 60 - 1 });

    expect((await verify(token)).status).toBe(200);
  });

  it('expires a link older than 24 hours and verifies nothing', async () => {
    const token = await issueToken();

    travel({ minutes: 24 * 60 + 1 });

    expect((await verify(token)).status).toBe(410);
    expect(await verifiedAt()).toBeNull();
  });

  it('treats an unknown token as expired', async () => {
    const response = await verify('e2e-unknown');

    expect(response.status).toBe(410);
    expect(((await response.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/link-expired`,
    );
  });

  it('sends a signed-in booker a new link and stops the earlier one working', async () => {
    const earlier = await issueToken();
    expect((await browser.signIn(RUTH)).status).toBe(200);

    const response = await resend();

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { accepted: true } });
    expectContract(response, RESEND, { data: { accepted: true } });
    expect(emailsTo(RUTH).map((email) => email.subject)).toEqual([VERIFY_SUBJECT]);
    const [unused] = await query<{ total: number }>(
      sql`select count(*)::int as total from email_verification_tokens where user_id = ${ruthId} and used_at is null`,
    );
    expect(unused?.total).toBe(1);
    expect((await verify(earlier)).status).toBe(410);
  });

  it('sends a working 24-hour link', async () => {
    expect((await browser.signIn(RUTH)).status).toBe(200);

    expect((await resend()).status).toBe(202);

    const [email] = emailsTo(RUTH);
    const link = /\/verify-email\?token=([A-Za-z0-9]+)&returnUrl=%2F/.exec(email?.text ?? '');
    expect(link, 'The new email holds a link back to Discover.').not.toBeNull();
    expect((await verify(link?.[1] ?? '')).status).toBe(200);
  });

  it('sends a guest with an expired link a new one', async () => {
    const expired = await issueToken();
    travel({ days: 2 });

    const response = await resend({ token: expired });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { accepted: true } });
    expect(emailsTo(RUTH)).toHaveLength(1);
  });

  it('lets a revoked link still name its owner for another link', async () => {
    const revoked = await issueToken();
    expect((await resend({ email: RUTH })).status).toBe(202);
    expect((await verify(revoked)).status).toBe(410);

    expect((await resend({ token: revoked })).status).toBe(202);

    expect(emailsTo(RUTH)).toHaveLength(2);
  });

  it('sends a guest who just signed up a new link by address', async () => {
    expect((await resend({ email: 'Ruth.Adeyemi@GracePoint.ca' })).status).toBe(202);

    expect(emailsTo(RUTH)).toHaveLength(1);
  });

  it('gives an unknown address or token the same answer and sends nothing', async () => {
    const byEmail = await resend({ email: 'nobody@gracepoint.ca' });
    expect(byEmail.status).toBe(202);
    expect(await byEmail.json()).toEqual({ data: { accepted: true } });
    const byToken = await resend({ token: 'e2e-unknown' });
    expect(byToken.status).toBe(202);
    expect(await byToken.json()).toEqual({ data: { accepted: true } });

    expect(sentEmails()).toEqual([]);
  });

  it('does not send a verified address another link', async () => {
    const response = await resend({ email: NAOMI });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { accepted: true } });
    expect(sentEmails()).toEqual([]);
  });

  it('refuses the 4th resend in 15 minutes', async () => {
    expect((await browser.signIn(RUTH)).status).toBe(200);
    for (let i = 1; i <= 3; i++) {
      expect((await resend()).status, `resend ${String(i)}`).toBe(202);
    }

    const response = await resend();

    expect(response.status).toBe(429);
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/too-many-requests`);
    expectContract(response, RESEND, body);
    travel({ minutes: 15 });
    expect((await resend()).status).toBe(202);
  });

  function issueToken(): Promise<string> {
    return db().transaction((tx) => issueEmailVerificationToken(tx, ruthId));
  }

  function verify(token: string): Promise<Response> {
    return browser.json('/api/v1/email/verify', 'POST', { token });
  }

  function resend(body: Record<string, string> = {}): Promise<Response> {
    return browser.json('/api/v1/email/verification-notification', 'POST', body);
  }

  async function verifiedAt(): Promise<string | null> {
    const [row] = await query<{ email_verified_at: string | null }>(
      sql`select email_verified_at from users where id = ${ruthId}`,
    );
    return row?.email_verified_at === null || row?.email_verified_at === undefined
      ? null
      : new Date(row.email_verified_at).toISOString();
  }
});
