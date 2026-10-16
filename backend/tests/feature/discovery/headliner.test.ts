import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import {
  artistRatings,
  artists,
  bookings,
  bookingTransitions,
  reviews,
  users,
} from '@/server/db/schema';
import { torontoTime } from '@/server/support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { artistId, lineup, search } from '../../support/discovery';

const SEARCH = { method: 'get', path: '/search' };

/**
 * L2-006.2, .5-.7: the most-booked artist this season leads the lineup as the headliner, with the
 * most recent visible 5-star quote; the tickets follow from "No. 02". Today is Fri 9 Oct 2026
 * (autumn).
 */
describe('the headliner', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it('is Abigail, most booked this autumn, and the tickets follow closest first', async () => {
    const response = await search();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Awaited<ReturnType<typeof lineup>>;
    expect(body.meta.total).toBe(7);
    expect(body.headliner?.slug).toBe('abigail-mensah');
    expect(body.headliner?.season).toBe('autumn');
    expect(body.headliner?.distance.km).toBe(44);
    expect(body.headliner?.quote).toEqual({
      text: 'She had the whole congregation singing in three-part harmony by the last verse.',
      reviewerName: 'Rev. Janet Clarke',
      city: 'Oshawa',
    });
    expect(body.data.map((card) => card.name)).toEqual([
      'Marcus Bell Trio',
      'Hosanna Collective',
      'Luz Viva',
      'Elijah Park',
      'Grace Tabernacle Mass Choir',
      'Daniel & Ruth Okonkwo',
    ]);
    expectContract(response, SEARCH, body);
  });

  it('does not count bookings confirmed before the season began', async () => {
    await db()
      .update(bookingTransitions)
      .set({ occurredAt: torontoTime('2026-08-20 12:00:00') })
      .where(inArray(bookingTransitions.bookingId, await bookingIds('abigail-mensah')));

    expect((await lineup()).headliner?.slug).toBe('marcus-bell-trio');
  });

  it('does not count bookings cancelled later', async () => {
    await db()
      .update(bookings)
      .set({ status: 'cancelled' })
      .where(inArray(bookings.id, await bookingIds('abigail-mensah')));

    expect((await lineup()).headliner?.slug).toBe('marcus-bell-trio');
  });

  it('gives a tie to the higher rating, then the shorter distance', async () => {
    await db()
      .update(bookings)
      .set({ status: 'cancelled' })
      .where(inArray(bookings.id, await bookingIds('abigail-mensah')));
    const hosanna = await artistId('hosanna-collective');
    await confirmThisSeason(hosanna, 'ZAM-0301');

    // Marcus 4.6 and Hosanna 4.8 each have one booking this autumn: the rating decides.
    expect((await lineup()).headliner?.slug).toBe('hosanna-collective');

    // Equal ratings: Marcus is closer (14 km against 32 km).
    await db()
      .update(artistRatings)
      .set({ rating: 4.6 })
      .where(eq(artistRatings.artistId, hosanna));
    expect((await lineup()).headliner?.slug).toBe('marcus-bell-trio');
  });

  it('makes a single result the headliner with no tickets', async () => {
    await db()
      .update(artists)
      .set({ status: 'suspended' })
      .where(eq(artists.slug, 'hosanna-collective'));

    const page = await lineup({ radius: 40 });

    expect(page.meta.total).toBe(1);
    expect(page.headliner?.slug).toBe('marcus-bell-trio');
    expect(page.headliner?.quote).toBeNull();
    expect(page.data).toEqual([]);
  });

  it('quotes the newest visible five-star review, cut at a word boundary', async () => {
    const abigail = await artistId('abigail-mensah');
    await review(abigail, 'Hidden praise.', '2026-10-05 09:00', true);
    const long =
      'From the first note she held the room, and by the closing hymn even the ushers were singing along ' +
      'with her, which nobody at our church can remember happening before in all our years together.';
    await review(abigail, long, '2026-10-02 09:00');

    const quote = (await lineup()).headliner?.quote?.text ?? '';

    expect([...quote].length).toBeLessThanOrEqual(161);
    expect(quote.endsWith('…')).toBe(true);
    expect(long.startsWith(quote.slice(0, -1))).toBe(true);
    expect(long.charAt(quote.length - 1)).toBe(' ');
  });
});

async function bookingIds(slug: string): Promise<number[]> {
  const rows = await db()
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(artists, eq(artists.id, bookings.artistId))
    .where(eq(artists.slug, slug));
  return rows.map((row) => row.id);
}

async function confirmThisSeason(artist: number, number: string): Promise<void> {
  const [booking] = await db()
    .insert(bookings)
    .values({
      number,
      artistId: artist,
      status: 'confirmed',
      eventDate: '2026-12-06',
      kind: 'sunday-service',
      churchName: 'Harvest Point',
      churchCity: 'Milton',
    })
    .returning({ id: bookings.id });
  await db()
    .insert(bookingTransitions)
    .values({
      bookingId: booking?.id ?? 0,
      fromStatus: 'accepted',
      toStatus: 'confirmed',
      actorKind: 'booker',
      occurredAt: torontoTime('2026-09-30 12:00:00'),
    });
}

async function review(
  artist: number,
  text: string,
  createdAt: string,
  hidden = false,
): Promise<void> {
  const [booker] = await db()
    .insert(users)
    .values({
      name: 'Grace Ampofo',
      email: `grace-${String(Math.random()).slice(2)}@example.test`,
      password: 'x',
    })
    .returning({ id: users.id });
  const [booking] = await db()
    .insert(bookings)
    .values({
      number: `ZAM-${String(Math.floor(5000 + Math.random() * 4999))}`,
      artistId: artist,
      status: 'completed',
      eventDate: '2026-09-27',
      kind: 'sunday-service',
      churchName: 'Kingdom Life Centre',
      churchCity: 'Mississauga',
    })
    .returning({ id: bookings.id });
  await db()
    .insert(reviews)
    .values({
      bookingId: booking?.id ?? 0,
      artistId: artist,
      bookerId: booker?.id ?? 0,
      stars: 5,
      text,
      createdAt: torontoTime(createdAt),
      hiddenAt: hidden ? torontoTime('2026-10-06 09:00') : null,
    });
}
