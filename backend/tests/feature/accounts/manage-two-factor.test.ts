import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { Browser, freshBooker, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { emailsTo } from '../../support/mail';
import { currentCode, turnOnTwoFactor } from '../../support/two-factor';

const TURN_OFF = { method: 'delete', path: '/account/two-factor' };
const NEW_CODES = { method: 'post', path: '/account/two-factor/recovery-codes' };
const WRONG =
  'That code is wrong or has expired. Enter the code your app shows now, or an unused recovery code.';

/**
 * L2-072.5 (accounts/sign-in-and-recover-access): turning two-step sign-in off, or getting new
 * recovery codes, needs a current code or an unused recovery code first; new codes replace every
 * earlier one. Wrong codes count toward the pause. Each change is emailed (M2 D21) and audited.
 */
describe('managing two-step sign-in', () => {
  let email: string;
  let browser: Browser;
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
    browser = await signedIn(email);
    ({ secret, recoveryCodes } = await turnOnTwoFactor(browser));
  });

  it('turns it off with a current code', async () => {
    const response = await turnOff(currentCode(secret));

    expect(response.status).toBe(204);
    expectContract(response, TURN_OFF, null);
    const user = await ruth();
    expect(user?.mfa_enabled).toBe(false);
    expect(user?.two_factor_secret).toBeNull();
    expect(
      await query(sql`select id from recovery_codes where user_id = ${user?.id ?? 0}`),
    ).toEqual([]);
    const audit = await query(
      sql`select id from audit_entries where action = 'auth.two_factor_disabled' and actor_id = ${user?.id ?? 0}`,
    );
    expect(audit).toHaveLength(1);
    expect(emailsTo(email).map((message) => message.subject)).toContain(
      'Two-step sign-in is off for your Zamaro account',
    );
    const signIn = await new Browser().signIn(email);
    expect(signIn.status).toBe(200);
    expect(((await signIn.json()) as { data: { mfaEnabled: boolean } }).data.mfaEnabled).toBe(
      false,
    );
  });

  it('turns it off with an unused recovery code too', async () => {
    expect((await turnOff(recoveryCodes[0] ?? '')).status).toBe(204);

    expect((await ruth())?.mfa_enabled).toBe(false);
  });

  it('changes nothing on a wrong code, which counts toward the pause', async () => {
    const response = await turnOff('000000');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.code?.[0]).toBe(WRONG);
    expectContract(response, TURN_OFF, body);
    expect((await ruth())?.mfa_enabled).toBe(true);

    for (let i = 0; i < 4; i++) expect((await turnOff('000000')).status).toBe(422);
    const paused = await turnOff(currentCode(secret));
    expect(paused.status).toBe(429);
    expect(((await paused.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/sign-in-paused`,
    );
    expect((await ruth())?.mfa_enabled).toBe(true);
  });

  it('replaces every earlier code with new ones', async () => {
    const response = await newCodes(currentCode(secret));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { recoveryCodes: string[] } };
    expectContract(response, NEW_CODES, body);
    const codes = body.data.recoveryCodes;
    expect(codes).toHaveLength(10);
    expect(codes.filter((code) => recoveryCodes.includes(code))).toEqual([]);
    const user = await ruth();
    expect(user?.mfa_enabled).toBe(true);
    const audit = await query(
      sql`select id from audit_entries where action = 'auth.recovery_codes_replaced' and actor_id = ${user?.id ?? 0}`,
    );
    expect(audit).toHaveLength(1);
    expect(emailsTo(email).map((message) => message.subject)).toContain(
      'New recovery codes for your Zamaro account',
    );

    expect((await turnOff(recoveryCodes[1] ?? '')).status).toBe(422);
    expect((await turnOff(codes[1] ?? '')).status).toBe(204);
  });

  it('lets a recovery code prove it is you for new codes', async () => {
    expect((await newCodes(recoveryCodes[2] ?? '')).status).toBe(200);

    const wrong = await newCodes('000000');
    expect(wrong.status).toBe(422);
    expect(((await wrong.json()) as { errors: Record<string, string[]> }).errors.code?.[0]).toBe(
      WRONG,
    );
  });

  it('has nothing to turn off once it is off', async () => {
    expect((await turnOff(currentCode(secret))).status).toBe(204);

    expect((await turnOff(currentCode(secret))).status).toBe(404);
    expect((await newCodes(currentCode(secret))).status).toBe(404);
  });

  function turnOff(code: string): Promise<Response> {
    return browser.json('/api/v1/account/two-factor', 'DELETE', { code });
  }

  function newCodes(code: string): Promise<Response> {
    return browser.json('/api/v1/account/two-factor/recovery-codes', 'POST', { code });
  }

  async function ruth(): Promise<
    { id: number; mfa_enabled: boolean; two_factor_secret: string | null } | undefined
  > {
    const [row] = await query<{
      id: number;
      mfa_enabled: boolean;
      two_factor_secret: string | null;
    }>(sql`select id, mfa_enabled, two_factor_secret from users where email = ${email}`);
    return row;
  }
});
