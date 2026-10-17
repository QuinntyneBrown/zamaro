import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Browser, freshBooker, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { emailsTo } from '../../support/mail';
import { beginTwoFactor, currentCode } from '../../support/two-factor';

const BEGIN = { method: 'post', path: '/account/two-factor' };
const CONFIRM = { method: 'post', path: '/account/two-factor/confirm' };

/**
 * L2-072.3 (accounts/sign-in-and-recover-access): a booker or artist turns on TOTP two-step sign-in
 * with a key for their authenticator app; the first right code turns it on and gives 10 single-use
 * recovery codes, shown once. The owner is emailed (M2 D21).
 */
describe('turning on two-step sign-in', () => {
  let email: string;
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    email = await freshBooker();
    browser = await signedIn(email);
  });

  it('gives a key and a QR code at the start, and turns nothing on', async () => {
    const response = await browser.json('/api/v1/account/two-factor', 'POST');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { key: string; otpauthUri: string } };
    expectContract(response, BEGIN, body);
    expect(body.data.key, 'The key is base32, in groups of four.').toMatch(
      /^([A-Z2-7]{4} )+[A-Z2-7]{1,4}$/,
    );
    expect(body.data.otpauthUri.startsWith('otpauth://totp/Zamaro:')).toBe(true);
    expect(body.data.otpauthUri).toContain(`secret=${body.data.key.replace(/ /g, '')}`);
    const user = await ruth();
    expect(user?.mfa_enabled).toBe(false);
    expect(user?.two_factor_secret?.startsWith('v1:')).toBe(true);

    const qr = await browser.request('/api/v1/account/two-factor/qr');
    expect(qr.status).toBe(200);
    expect(qr.headers.get('content-type')).toBe('image/svg+xml');
    expect(await qr.text()).toContain('<svg');
    expect(qr.headers.get('cache-control')).toContain('no-store');
  });

  it('turns it on with the first right code and 10 recovery codes', async () => {
    const secret = await beginTwoFactor(browser);

    const response = await confirm(currentCode(secret));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { recoveryCodes: string[] } };
    expectContract(response, CONFIRM, body);
    const codes = body.data.recoveryCodes;
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) expect(code).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/);
    const user = await ruth();
    expect(user?.mfa_enabled).toBe(true);
    expect(user?.two_factor_confirmed_at).not.toBeNull();
    const stored = await query<{ code_hash: string }>(
      sql`select code_hash from recovery_codes where user_id = ${user?.id ?? 0}`,
    );
    expect(stored).toHaveLength(10);
    expect(
      stored.map((row) => row.code_hash),
      'Only hashes are stored.',
    ).not.toContain(codes[0]);
    const me = (await (await browser.json('/api/v1/me', 'GET')).json()) as {
      data: { mfaEnabled: boolean };
    };
    expect(me.data.mfaEnabled).toBe(true);
    const audit = await query(
      sql`select id from audit_entries where action = 'auth.two_factor_enabled' and actor_id = ${user?.id ?? 0}`,
    );
    expect(audit).toHaveLength(1);
    expect(emailsTo(email)).toHaveLength(1);
  });

  it('says so in the email', async () => {
    const secret = await beginTwoFactor(browser);

    expect((await confirm(currentCode(secret))).status).toBe(200);

    const [sent] = emailsTo(email);
    expect(sent?.subject).toBe('Two-step sign-in is on for your Zamaro account');
    expect(sent?.to.address).toBe(email);
  });

  it('turns nothing on for a wrong code', async () => {
    await beginTwoFactor(browser);

    const response = await confirm('000000');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.code?.[0]).toBe(
      'That code didn’t match. Codes change every 30 seconds; enter the one showing now.',
    );
    expectContract(response, CONFIRM, body);
    expect((await ruth())?.mfa_enabled).toBe(false);
    expect(await query(sql`select id from recovery_codes`)).toEqual([]);
  });

  it('needs a key first, and a second key replaces the first', async () => {
    const early = await confirm('123456');
    expect(early.status).toBe(422);
    expect(((await early.json()) as { errors: object }).errors).toHaveProperty('code');
    const first = await beginTwoFactor(browser);
    const second = await beginTwoFactor(browser);

    expect(first).not.toBe(second);
    expect((await confirm(currentCode(first))).status).toBe(422);
    expect((await confirm(currentCode(second))).status).toBe(200);
  });

  it('cannot be turned on twice', async () => {
    expect((await confirm(currentCode(await beginTwoFactor(browser)))).status).toBe(200);

    expect((await browser.json('/api/v1/account/two-factor', 'POST')).status).toBe(409);
  });

  it('gives a guest 401', async () => {
    const guest = new Browser();
    await guest.request('/api/v1/csrf-cookie');

    expect((await guest.json('/api/v1/account/two-factor', 'POST')).status).toBe(401);
  });

  function confirm(code: string): Promise<Response> {
    return browser.json('/api/v1/account/two-factor/confirm', 'POST', { code });
  }

  async function ruth(): Promise<
    | {
        id: number;
        mfa_enabled: boolean;
        two_factor_secret: string | null;
        two_factor_confirmed_at: string | null;
      }
    | undefined
  > {
    const [row] = await query<{
      id: number;
      mfa_enabled: boolean;
      two_factor_secret: string | null;
      two_factor_confirmed_at: string | null;
    }>(
      sql`select id, mfa_enabled, two_factor_secret, two_factor_confirmed_at from users where email = ${email}`,
    );
    return row;
  }
});
