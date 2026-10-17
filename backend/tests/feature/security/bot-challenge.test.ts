import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { useBotChallenge } from '@/server/integrations/bindings';
import { FakeBotChallenge } from '@/server/integrations/bot-challenge/fake-bot-challenge';
import { Browser } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { sentEmails } from '../../support/mail';

const REGISTER = { method: 'post', path: '/register' };
const EMAIL = 'ruth.adeyemi@gracepoint.ca';
const MESSAGE =
  'We couldn’t check that you’re a person. Try again; if it keeps happening, email hello@zamaro.ca.';

/**
 * L2-077.4: registration needs a passing bot challenge before anything else runs. A failed, missing
 * or unverifiable token gets the same 422 on `challengeToken` (security/limit-request-rates, M2 D3).
 */
describe('the bot challenge', () => {
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase({ seed: false });
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');
  });

  it('refuses a failed challenge and creates nothing', async () => {
    const response = await register('fail', { password: 'short' });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.challengeToken?.[0]).toBe(MESSAGE);
    expect(body.errors).not.toHaveProperty('password');
    expectContract(response, REGISTER, body);
    expect(await query(sql`select id from users where email = ${EMAIL}`)).toEqual([]);
    expect(sentEmails()).toEqual([]);
  });

  it('refuses a missing token the same way', async () => {
    const response = await register(undefined);

    expect(response.status).toBe(422);
    expect(await challengeError(response)).toBe(MESSAGE);
  });

  it('fails closed when the provider cannot be reached', async () => {
    useBotChallenge(new FakeBotChallenge(true));

    const response = await register('pass');

    expect(response.status).toBe(422);
    expect(await challengeError(response)).toBe(MESSAGE);
    expect(await query(sql`select id from users where email = ${EMAIL}`)).toEqual([]);
  });

  it('lets a passing token through', async () => {
    expect((await register('pass')).status).toBe(202);
  });

  async function challengeError(response: Response): Promise<string | undefined> {
    const body = (await response.json()) as { errors: Record<string, string[]> };
    return body.errors.challengeToken?.[0];
  }

  function register(
    challengeToken: string | undefined,
    overrides: Record<string, unknown> = {},
  ): Promise<Response> {
    return browser.json('/api/v1/register', 'POST', {
      name: 'Ruth Adeyemi',
      email: EMAIL,
      password: 'hosanna-in-the-highest',
      acceptedTerms: true,
      marketingOptIn: false,
      termsVersion: '2026-10',
      privacyPolicyVersion: '2026-10',
      ...(challengeToken !== undefined && { challengeToken }),
      ...overrides,
    });
  }
});
