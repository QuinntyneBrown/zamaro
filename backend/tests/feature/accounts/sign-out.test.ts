import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { Browser, NAOMI, signedIn } from '../../support/accounts';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const SESSION = { method: 'delete', path: '/session' };

/**
 * L2-023.5: signing out ends the session on the server, so the cookie the browser held is worth
 * nothing afterwards. The CSRF token is rotated with it (manage-sessions-and-csrf).
 */
describe('signing out', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it('signs Naomi out and leaves her a guest', async () => {
    const browser = await signedIn(NAOMI);

    const response = await browser.json('/api/v1/session', 'DELETE');

    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(401);
    expectContract(response, SESSION, null);
  });

  it('gives the session cookie she held 401 once she has signed out', async () => {
    const browser = await signedIn(NAOMI);
    const session = browser.cookie('zamaro_session') ?? '';
    const other = new Browser();
    other.cookies.set('zamaro_session', session);
    expect((await other.json('/api/v1/me', 'GET')).status).toBe(200);

    expect((await browser.json('/api/v1/session', 'DELETE')).status).toBe(204);

    const stale = new Browser();
    stale.cookies.set('zamaro_session', session);
    expect((await stale.json('/api/v1/me', 'GET')).status).toBe(401);
  });

  it('takes the session off the registry', async () => {
    const browser = await signedIn(NAOMI);
    expect((await query(sql`SELECT count(*)::int AS n FROM user_sessions`))[0]?.n).toBe(1);

    expect((await browser.json('/api/v1/session', 'DELETE')).status).toBe(204);

    expect((await query(sql`SELECT count(*)::int AS n FROM user_sessions`))[0]?.n).toBe(0);
  });

  it('gives the browser a new session and csrf token', async () => {
    const browser = await signedIn(NAOMI);
    const session = browser.cookie('zamaro_session');
    const token = browser.cookie('XSRF-TOKEN');

    await browser.json('/api/v1/session', 'DELETE');

    expect(browser.cookie('zamaro_session')).not.toBe(session);
    expect(browser.cookie('XSRF-TOKEN')).not.toBe(token);
  });

  it('gives a guest who signs out the 401 problem', async () => {
    const browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');

    const response = await browser.json('/api/v1/session', 'DELETE');

    expect(response.status).toBe(401);
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/unauthenticated`);
    expectContract(response, SESSION, body);
  });
});
