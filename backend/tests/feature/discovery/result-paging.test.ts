import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anchor } from '@/server/integrations/routing/cast-routes';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { lineup, search, type LineupCard } from '../../support/discovery';

const SEARCH = { method: 'get', path: '/search' };
const barrie = anchor('Barrie');
const BARRIE = { lat: barrie.latitude, lng: barrie.longitude, radius: 40 };

/**
 * L2-010 and L2-095.1: results come 24 cards at a time, the headliner included, with a cursor for
 * the rest. The supporting cast around Barrie has 30 artists free on Sat 14 Nov within 40 km.
 */
describe('result paging', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  it('holds 24 cards on the first page and a cursor for the rest', async () => {
    const response = await search(BARRIE);

    expect(response.status).toBe(200);
    const body = (await response.json()) as Awaited<ReturnType<typeof lineup>>;
    expect(body.meta.total).toBe(30);
    expect(body.meta.perPage).toBe(24);
    expect(body.data).toHaveLength(23);
    expect(body.headliner).not.toBeNull();
    expect(body.meta.nextCursor).not.toBeNull();
    expectContract(response, SEARCH, body);
  });

  it('holds the remaining six tickets and no headliner on the next page', async () => {
    const first = await lineup(BARRIE);

    const next = await lineup({ ...BARRIE, cursor: first.meta.nextCursor });

    expect(next.data).toHaveLength(6);
    expect(next.headliner).toBeNull();
    expect(next.meta.nextCursor).toBeNull();
    const firstSlugs = first.data.map((card) => card.slug);
    expect(next.data.filter((card) => firstSlugs.includes(card.slug))).toEqual([]);
    expect(next.data.map((card) => card.slug)).not.toContain(first.headliner?.slug);
  });

  it('pages stably under every sort', async () => {
    for (const sort of ['closest', 'rating', 'price']) {
      const first = await lineup({ ...BARRIE, sort });
      const next = await lineup({ ...BARRIE, sort, cursor: first.meta.nextCursor });
      const tickets = [...first.data, ...next.data];

      expect(new Set(tickets.map((card) => card.slug)).size, `${sort}: every ticket once`).toBe(29);
      let previous: LineupCard | undefined;
      for (const current of tickets) {
        if (previous !== undefined) {
          expect(
            compare(sortKey(previous, sort), sortKey(current, sort)),
            `${sort}: ${previous.slug} should not follow ${current.slug}`,
          ).toBeLessThanOrEqual(0);
        }
        previous = current;
      }
    }
  });

  it('has no next page for 24 or fewer results', async () => {
    const page = await lineup();

    expect(page.meta.total).toBe(7);
    expect(page.meta.nextCursor).toBeNull();
  });

  it('refuses a cursor that does not decode or belongs to another sort', async () => {
    const garbage = await search({ ...BARRIE, cursor: 'not-a-cursor' });
    expect(garbage.status).toBe(422);
    expect(Object.keys(((await garbage.json()) as { errors: object }).errors)).toEqual(['cursor']);

    const priceCursor = (await lineup({ ...BARRIE, sort: 'price' })).meta.nextCursor;
    const wrongSort = await search({ ...BARRIE, sort: 'rating', cursor: priceCursor });
    expect(wrongSort.status).toBe(422);
    expect(Object.keys(((await wrongSort.json()) as { errors: object }).errors)).toEqual([
      'cursor',
    ]);
  });
});

/** L2-007's order for a card, from the fields the response carries (the id tie-break aside). */
function sortKey(card: LineupCard, sort: string): number[] {
  switch (sort) {
    case 'rating':
      return [
        card.rating === null ? 1 : 0,
        -(card.rating ?? 0),
        -card.reviewCount,
        card.distance.km,
      ];
    case 'price':
      return [card.fromPrice.cents, card.distance.km];
    default:
      return [card.distance.km, -(card.rating ?? 0)];
  }
}

function compare(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
