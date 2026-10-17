import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { Browser, NAOMI, signedIn } from '../../support/accounts';
import { api } from '../../support/app';
import { resetClock, travel } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const FEATURES = { method: 'get', path: '/features' };

/**
 * L2-077.1: anonymous traffic from one address gets 120 API requests a minute; the next is refused
 * with a 429 problem and `Retry-After`. A signed-in person is counted by account instead, at 300 a
 * minute (M2 D7), wherever they connect from (security/limit-request-rates).
 */
describe('the anonymous rate limit', () => {
  beforeAll(async () => {
    await freshDatabase({ seed: false });
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase({ seed: false });
    resetClock();
  });

  it('refuses the 121st anonymous request in a minute with retry-after', async () => {
    await spend(120, () => api('/api/v1/features'));

    const response = await api('/api/v1/features');

    expect(response.status).toBe(429);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/too-many-requests`);
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
    expectContract(response, FEATURES, body);
  });

  it('counts every api route toward the same allowance', async () => {
    await spend(60, () => api('/api/v1/features'));
    await spend(60, () => api('/api/v1/i18n/en'));

    expect((await api('/api/v1/features')).status).toBe(429);
  });

  it('gives another address its own allowance', async () => {
    await spend(120, () => api('/api/v1/features'));
    expect((await api('/api/v1/features')).status).toBe(429);

    const response = await api('/api/v1/features', {
      headers: { 'X-Forwarded-For': '203.0.113.7' },
    });

    expect(response.status).toBe(200);
  });

  it('lets requests resume once the minute has passed', async () => {
    await spend(120, () => api('/api/v1/features'));
    expect((await api('/api/v1/features')).status).toBe(429);

    travel({ seconds: 61 });

    expect((await api('/api/v1/features')).status).toBe(200);
  });

  it('counts a signed-in booker by account from any address', async () => {
    await freshDatabase();
    const browser = await signedIn(NAOMI);
    const asNaomiFrom = (address: string): Promise<Response> => {
      browser.address = address;
      return browser.json('/api/v1/me', 'GET');
    };

    await spend(300, () => asNaomiFrom('127.0.0.1'));

    expect((await asNaomiFrom('198.51.100.20')).status).toBe(429);
  });

  async function spend(requests: number, request: () => Promise<Response>): Promise<void> {
    for (let i = 1; i <= requests; i++) {
      expect((await request()).status, `request ${String(i)}`).toBeLessThan(300);
    }
  }
});

export { Browser };
