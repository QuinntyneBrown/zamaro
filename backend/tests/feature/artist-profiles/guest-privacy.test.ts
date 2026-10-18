import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { churches, users } from '@/server/db/schema';
import { api } from '../../support/app';
import { closeDatabase, freshDatabase } from '../../support/database';

const SEARCH = '?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&radius=120';

/**
 * L2-083.3: nothing a guest can fetch while choosing an artist carries a booker's email or their
 * church's street address or postal code. Names and cities are public by design (L2-083.2).
 */
describe('what a guest can learn about bookers while choosing an artist', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  it('never includes a booker email or a church street address', async () => {
    const bookers = await db()
      .select({
        email: users.email,
        streetAddress: churches.streetAddress,
        postalCode: churches.postalCode,
      })
      .from(churches)
      .innerJoin(users, eq(users.id, churches.bookerId));
    expect(bookers.length).toBeGreaterThan(0);
    const private_ = bookers.flatMap((booker) => [
      booker.email,
      booker.streetAddress,
      booker.postalCode,
    ]);

    const paths = [
      `/api/v1/search${SEARCH}`,
      `/api/v1/search/alternatives${SEARCH}`,
      '/api/v1/places?q=Burlington',
      `/api/v1/artists/abigail-mensah${SEARCH}`,
      '/api/v1/artists/abigail-mensah/reviews',
      '/api/v1/artists/abigail-mensah/tour-dates',
      '/api/v1/artists/abigail-mensah/availability?date=2026-11-14',
      '/api/v1/artists/nobody-at-all',
      '/api/v1/sitemap',
    ];

    for (const path of paths) {
      const response = await api(path);
      expect(response.status, path).toBeLessThan(500);
      const text = await response.text();
      for (const secret of private_) {
        expect(text, `${path} leaked ${secret}`).not.toContain(secret);
      }
    }
  });
});
