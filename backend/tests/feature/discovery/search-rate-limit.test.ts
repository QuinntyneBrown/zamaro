import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { resetClock, travel } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { search } from '../../support/discovery';

const SEARCH = { method: 'get', path: '/search' };

/**
 * L2-077.2: more than 30 searches a minute from one address are refused with a 429 problem that
 * says when to try again. A signed-in booker's own allowance is proven with the session slice.
 */
describe('the search rate limit', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    // A fresh limiter and clock for every test.
    await freshDatabase({ seed: false });
    resetClock();
  });

  it('refuses the thirty-first search in a minute with retry-after', async () => {
    for (let i = 1; i <= 30; i++) {
      expect((await search()).status, `search ${String(i)}`).toBe(200);
    }

    const response = await search();

    expect(response.status).toBe(429);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string; status: number };
    expect(body.type).toBe(`${config().problemsBaseUri}/too-many-requests`);
    expect(body.status).toBe(429);
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
    expectContract(response, SEARCH, body);
  });

  it('lets searching resume once the minute has passed', async () => {
    for (let i = 1; i <= 31; i++) await search();

    travel({ seconds: 61 });

    expect((await search()).status).toBe(200);
  });

  it('gives another address its own allowance', async () => {
    for (let i = 1; i <= 31; i++) await search();

    const response = await searchFrom('203.0.113.7');

    expect(response.status).toBe(200);
  });
});

/** A search forwarded by Zamaro Web's server for a browser at `ip` (the trusted proxy sets the header). */
async function searchFrom(ip: string): Promise<Response> {
  const { api } = await import('../../support/app');
  const { REFERENCE_SEARCH } = await import('../../support/discovery');
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(REFERENCE_SEARCH).map(([k, v]) => [k, String(v)])),
  );
  return api(`/api/v1/search?${params.toString()}`, { headers: { 'X-Forwarded-For': ip } });
}
