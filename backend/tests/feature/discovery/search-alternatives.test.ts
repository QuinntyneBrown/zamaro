import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { availabilityOverrides } from '@/server/db/schema';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { artistId, lineup } from '../../support/discovery';

const ALTERNATIVES = { method: 'get', path: '/search/alternatives' };

/** Christmas Eve near Burlington, gospel choirs, 40 km (docs/mocks/pages/discover/empty.html). */
const CHRISTMAS_EVE: Record<string, string | number | null> = {
  date: '2026-12-24',
  kind: 'worship-night',
  lat: 43.325,
  lng: -79.799,
  radius: 40,
  styles: 'gospel-choir',
};

interface Alternatives {
  data: {
    nearbyDates: { date: string; count: number }[];
    widerRadius: { km: number; count: number } | null;
    filtersApplied: boolean;
  };
}

/**
 * L2-011.2-4: when nobody is free, up to three nearby dates with their counts (closest first,
 * within 7 days either side), the smallest wider radius with matches, and whether filters apply.
 */
describe('search alternatives', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it('offers nearby dates closest first and a wider radius on Christmas Eve', async () => {
    expect((await lineup(CHRISTMAS_EVE)).meta.total).toBe(0);

    const response = await alternatives();

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({
      data: {
        nearbyDates: [
          { date: '2026-12-23', count: 1 },
          { date: '2026-12-27', count: 3 },
          { date: '2026-12-20', count: 2 },
        ],
        widerRadius: { km: 120, count: 2 },
        filtersApplied: true,
      },
    });
    expectContract(response, ALTERNATIVES, body);
  });

  it('lists the earlier of two dates equally far away first', async () => {
    await db()
      .insert(availabilityOverrides)
      .values({
        artistId: await artistId('halton-praise-choir'),
        date: '2026-12-28',
        state: 'free',
      });

    const body = (await (await alternatives()).json()) as Alternatives;

    expect(body.data.nearbyDates.map((date) => date.date)).toEqual([
      '2026-12-23',
      '2026-12-27',
      '2026-12-20',
    ]);
  });

  it('says so when no filters apply', async () => {
    const body = (await (await alternatives({ styles: null })).json()) as Alternatives;

    expect(body.data.filtersApplied).toBe(false);
  });

  it('skips dates outside the bookable window', async () => {
    const body = (await (
      await alternatives({ date: '2026-10-13', styles: null })
    ).json()) as Alternatives;

    expect(body.data.nearbyDates.length).toBeGreaterThan(0);
    for (const { date } of body.data.nearbyDates) {
      expect(date >= '2026-10-12').toBe(true);
    }
  });

  it('has no wider option at the widest radius', async () => {
    const body = (await (await alternatives({ radius: 200 })).json()) as Alternatives;

    expect(body.data.widerRadius).toBeNull();
  });
});

function alternatives(overrides: Record<string, string | number | null> = {}): Promise<Response> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...CHRISTMAS_EVE, ...overrides })) {
    if (value !== null) params.set(key, String(value));
  }
  return api(`/api/v1/search/alternatives?${params.toString()}`);
}
