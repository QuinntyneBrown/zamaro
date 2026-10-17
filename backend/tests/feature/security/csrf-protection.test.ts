import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { operations } from '@/server/http/openapi/operations';
import { Browser, NAOMI, signedIn } from '../../support/accounts';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const SESSION = { method: 'delete', path: '/session' };

/**
 * L2-073.2: a state-changing request without a valid CSRF token gets 419 and changes nothing
 * (security/manage-sessions-and-csrf, ADR-0018).
 */
describe('CSRF protection', () => {
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    browser = await signedIn(NAOMI);
  });

  it('refuses signing out without the token with 419, and Naomi stays signed in', async () => {
    const response = await signOut(null);

    expect(response.status).toBe(419);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string; status: number };
    expect(body.type).toBe(`${config().problemsBaseUri}/csrf-token-mismatch`);
    expect(body.status).toBe(419);
    expectContract(response, SESSION, body);
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(200);
  });

  it('refuses a wrong token with the same 419', async () => {
    expect((await signOut('not-the-token-at-all-but-forty-chars-long')).status).toBe(419);

    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(200);
  });

  it('refuses a same-origin request without the token too', async () => {
    const response = await signOut(null, { 'Sec-Fetch-Site': 'same-origin' });

    expect(response.status).toBe(419);
  });

  it('lets the token from the xsrf cookie through', async () => {
    expect((await signOut(browser.cookie('XSRF-TOKEN') ?? '')).status).toBe(204);
  });

  it('refuses a request without the token on every state-changing api route', async () => {
    const mutating = operations.filter((operation) => operation.method !== 'get');
    expect(mutating.length).toBeGreaterThan(0);

    for (const operation of mutating) {
      const path = `/api/v1${operation.path.replace(/\{[^}]+\}/g, '1')}`;
      const response = await browser.request(path, {
        method: operation.method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-XSRF-TOKEN': '',
        },
        body: '{}',
      });

      expect(response.status, `${operation.method.toUpperCase()} ${path}`).toBe(419);
    }
  });

  function signOut(token: string | null, extra: Record<string, string> = {}): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json', ...extra };
    // An empty header overrides the browser's automatic token with none.
    headers['X-XSRF-TOKEN'] = token ?? '';
    return browser.request('/api/v1/session', { method: 'DELETE', headers });
  }
});
