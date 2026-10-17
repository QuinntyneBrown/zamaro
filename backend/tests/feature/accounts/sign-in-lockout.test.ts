import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { Browser, NAOMI } from '../../support/accounts';
import { travel, travelTo } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { emailsTo, sentEmails } from '../../support/mail';

const SESSION = { method: 'post', path: '/session' };

/**
 * L2-072.4: 5 failed sign-ins for one address within 15 minutes pause sign-in for that address for
 * 15 minutes, and the owner is emailed once per pause. An address with no account is paused the same
 * way, so the answer never says which addresses have one (accounts/sign-in-and-recover-access).
 */
describe('the sign-in lockout', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    travelTo('2026-10-09 10:42');
  });

  it('refuses the sixth try after five failures, even with the right password', async () => {
    await failSignIns(NAOMI, 5);

    const browser = new Browser();
    const response = await browser.signIn(NAOMI);

    expect(response.status).toBe(429);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string; title: string; pausedUntil: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/sign-in-paused`);
    expect(body.title).toBe('Sign-in is paused for 15 minutes');
    expect(new Date(body.pausedUntil).toISOString()).toBe('2026-10-09T14:57:00.000Z');
    expect(response.headers.get('retry-after')).toBe('900');
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(401);
    expectContract(response, SESSION, body);
  });

  it('does not pause sign-in after four failures', async () => {
    await failSignIns(NAOMI, 4);

    expect((await new Browser().signIn(NAOMI)).status).toBe(200);
  });

  it('emails the owner once per pause', async () => {
    await failSignIns(NAOMI, 5);

    expect((await new Browser().signIn(NAOMI)).status).toBe(429);
    expect((await new Browser().signIn(NAOMI, 'wrong-again')).status).toBe(429);

    expect(emailsTo(NAOMI)).toHaveLength(1);
  });

  it('says in the locked email when sign-in resumes and offers a reset', async () => {
    await failSignIns(NAOMI, 5);

    expect((await new Browser().signIn(NAOMI)).status).toBe(429);

    const [email, ...rest] = sentEmails();
    expect(rest).toHaveLength(0);
    expect(email?.to.address).toBe(NAOMI);
    expect(email?.subject).toBe('Sign-in to your Zamaro account is paused');
    expect(email?.html).not.toBe('');
    expect(email?.text).toContain('10:57 a.m.');
    expect(email?.text).toContain(`${config().webUrl}/forgot-password`);
  });

  it('pauses an address with no account the same way and emails nobody', async () => {
    await failSignIns('nobody@gracepoint.ca', 5);

    const response = await new Browser().signIn('nobody@gracepoint.ca');

    expect(response.status).toBe(429);
    expect(((await response.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/sign-in-paused`,
    );
    expect(sentEmails()).toEqual([]);
  });

  it('counts the address in any case', async () => {
    await failSignIns('Naomi.Fraser@RiversideCC.ca', 5);

    expect((await new Browser().signIn(NAOMI)).status).toBe(429);
  });

  it('leaves other addresses alone while one is paused', async () => {
    await failSignIns('nobody@gracepoint.ca', 5);

    expect((await new Browser().signIn(NAOMI)).status).toBe(200);
  });

  it('resumes sign-in after 15 minutes', async () => {
    await failSignIns(NAOMI, 5);
    expect((await new Browser().signIn(NAOMI)).status).toBe(429);

    travel({ minutes: 15 });

    expect((await new Browser().signIn(NAOMI)).status).toBe(200);
  });

  it('does not add up failures more than 15 minutes apart', async () => {
    await failSignIns(NAOMI, 4);
    travel({ minutes: 16 });
    await failSignIns(NAOMI, 1);

    expect((await new Browser().signIn(NAOMI)).status).toBe(200);
  });

  it('starts the count again after a successful sign-in', async () => {
    await failSignIns(NAOMI, 4);
    expect((await new Browser().signIn(NAOMI)).status).toBe(200);

    await failSignIns(NAOMI, 4);

    expect((await new Browser().signIn(NAOMI)).status).toBe(200);
  });

  async function failSignIns(email: string, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      const response = await new Browser().signIn(email, 'not-the-password');
      expect(response.status, `failure ${String(i + 1)}`).toBe(422);
    }
  }
});
