import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artistRatings } from '@/server/db/schema';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { artistId, lineup, search } from '../../support/discovery';

const SEARCH = { method: 'get', path: '/search' };

/**
 * L2-007 (sort the tickets; the headliner stays first) and L2-008 (style chips OR together, the
 * price chip ANDs). The API is strict: unknown values are refused, only the frontend substitutes
 * defaults.
 */
describe('sorting and filtering results', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it('keeps the headliner and orders the tickets by from price, low to high', async () => {
    const response = await search({ sort: 'price' });

    expect(response.status).toBe(200);
    const body = (await response.json()) as Awaited<ReturnType<typeof lineup>>;
    expect(body.headliner?.name).toBe('Abigail Mensah');
    expect(body.data.map((card) => card.name)).toEqual([
      'Elijah Park',
      'Daniel & Ruth Okonkwo',
      'Luz Viva',
      'Marcus Bell Trio',
      'Hosanna Collective',
      'Grace Tabernacle Mass Choir',
    ]);
    expect(body.meta.sort).toBe('price');
    expectContract(response, SEARCH, body);
  });

  it('breaks rating ties by review count and puts unreviewed artists last', async () => {
    await db()
      .update(artistRatings)
      .set({ rating: null, reviewCount: 0 })
      .where(eq(artistRatings.artistId, await artistId('luz-viva')));

    expect((await lineup({ sort: 'rating' })).data.map((card) => card.name)).toEqual([
      'Daniel & Ruth Okonkwo',
      'Grace Tabernacle Mass Choir',
      'Hosanna Collective',
      'Elijah Park',
      'Marcus Bell Trio',
      'Luz Viva',
    ]);
  });

  it('matches any selected style chip', async () => {
    const page = await lineup({ styles: 'band,gospel-choir' });

    expect(page.meta.total).toBe(4);
    expect(page.meta.styles).toEqual(['band', 'gospel-choir']);
    expect(page.headliner?.name).toBe('Marcus Bell Trio');
    expect(page.data.map((card) => card.name)).toEqual([
      'Hosanna Collective',
      'Luz Viva',
      'Grace Tabernacle Mass Choir',
    ]);
  });

  it('applies under $800 on top of the styles', async () => {
    const page = await lineup({ styles: 'hymns', price: 'under-800' });

    expect(page.meta.total).toBe(2);
    expect(page.meta.price).toBe('under-800');
    expect(page.headliner?.name).toBe('Abigail Mensah');
    expect(page.data.map((card) => card.name)).toEqual(['Daniel & Ruth Okonkwo']);
  });

  it('refuses an unknown sort, style or price', async () => {
    const response = await search({ sort: 'cheapest', styles: 'band,polka', price: 'under-500' });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(Object.keys(body.errors).sort()).toEqual(['price', 'sort', 'styles']);
  });
});
