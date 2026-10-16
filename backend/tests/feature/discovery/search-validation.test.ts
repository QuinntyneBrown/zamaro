import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anchor } from '@/server/integrations/routing/cast-routes';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { search } from '../../support/discovery';

const SEARCH = { method: 'get', path: '/search' };

/**
 * L2-004.3-4, L2-001.2 and L2-095.2: a search that cannot run returns a 422 problem whose
 * `errors` are keyed by field, with the copy the Discover form shows. Today is Fri 9 Oct 2026.
 */
describe('search validation', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  it('refuses a date less than three days away', async () => {
    const response = await search({ date: '2026-10-11' });

    expect(response.status).toBe(422);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { status: number; errors: Record<string, string[]> };
    expect(body.status).toBe(422);
    expect(body.errors).toEqual({ date: ['Pick a date at least 3 days away.'] });
    expectContract(response, SEARCH, body);
  });

  it('allows three days away as the first date', async () => {
    expect((await search({ date: '2026-10-12' })).status).toBe(200);
  });

  it('refuses a date more than eighteen months away', async () => {
    const response = await search({ date: '2028-04-10' });

    expect(response.status).toBe(422);
    expect(((await response.json()) as { errors: unknown }).errors).toEqual({
      date: ['We take bookings up to 18 months ahead.'],
    });
    expect((await search({ date: '2028-04-09' })).status).toBe(200);
  });

  it('refuses a location outside the service area', async () => {
    const ottawa = anchor('Ottawa');

    const response = await search({ lat: ottawa.latitude, lng: ottawa.longitude });

    expect(response.status).toBe(422);
    expect(((await response.json()) as { errors: unknown }).errors).toEqual({
      location: ['Zamaro serves churches within 200 km of Toronto.'],
    });
  });

  it('names the fields to fill when the date and location are missing', async () => {
    const response = await api('/api/v1/search?kind=worship-night&radius=120');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.date).toEqual(['Pick your event date.']);
    expect(body.errors.location).toEqual([
      'Enter your church’s address or town, or pick a city below.',
    ]);
  });

  it('refuses an unknown kind or radius', async () => {
    const response = await search({ kind: 'concert', radius: 50 });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(Object.keys(body.errors).sort()).toEqual(['kind', 'radius']);
  });
});
