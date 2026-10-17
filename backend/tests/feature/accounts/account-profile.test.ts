import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ABIGAIL, Browser, freshBooker, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const PROFILE = { method: 'put', path: '/account/profile' };

/**
 * The Profile section of account settings (accounts/manage-account-settings): the person's name,
 * which artists see on requests and the header turns into initials (L2-024.2).
 */
describe('the account profile', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
  });

  it('saves a new name, and the initials follow it', async () => {
    const browser = await signedIn(await freshBooker());

    const response = await browser.json('/api/v1/account/profile', 'PUT', {
      name: '  Ruth Okafor  ',
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { name: string; initials: string } };
    expect(body.data.name).toBe('Ruth Okafor');
    expect(body.data.initials).toBe('RO');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, PROFILE, body);
    const me = (await (await browser.json('/api/v1/me', 'GET')).json()) as {
      data: { name: string };
    };
    expect(me.data.name).toBe('Ruth Okafor');
  });

  it('refuses a blank or overlong name', async () => {
    const browser = await signedIn(NAOMI);

    const blank = await browser.json('/api/v1/account/profile', 'PUT', { name: '   ' });
    expect(blank.status).toBe(422);
    expect(((await blank.json()) as { errors: Record<string, string[]> }).errors.name?.[0]).toBe(
      'Enter your name.',
    );
    const long = await browser.json('/api/v1/account/profile', 'PUT', { name: 'a'.repeat(121) });
    expect(long.status).toBe(422);
    expect(((await long.json()) as { errors: object }).errors).toHaveProperty('name');
    const me = (await (await browser.json('/api/v1/me', 'GET')).json()) as {
      data: { name: string };
    };
    expect(me.data.name).toBe('Naomi Fraser');
  });

  it('lets an artist rename their account too', async () => {
    const browser = await signedIn(ABIGAIL);

    const response = await browser.json('/api/v1/account/profile', 'PUT', {
      name: 'Abigail Mensah',
    });

    expect(response.status).toBe(200);
  });

  it('gives a guest 401', async () => {
    const browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');

    const response = await browser.json('/api/v1/account/profile', 'PUT', { name: 'Someone' });

    expect(response.status).toBe(401);
  });
});
