import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artists, bookings, reviews, users } from '@/server/db/schema';
import { recalculateArtistRating } from '@/server/services/reviews/recalculate-artist-rating';
import { torontoTime } from '@/server/support/clock';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { artistId } from '../../support/discovery';
import { profileData, type Review } from '../../support/profiles';

const REVIEWS = { method: 'get', path: '/artists/{slug}/reviews' };
const PROFILE = { method: 'get', path: '/artists/{slug}' };
const REVIEW_FIELDS = ['id', 'stars', 'text', 'attribution', 'reply'];

interface ReviewPage {
  data: Review[];
  meta: { perPage: number; nextCursor: string | null };
}

/**
 * L2-018, L2-020.2, L2-060 and L2-083.2: the reviews on a profile and the rating above them.
 * The one-job-per-artist queue behaviour is proven with the background-jobs slice.
 */
describe('showing reviews and the rating', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it('carries the rating and the four newest reviews with replies on the profile', async () => {
    const response = await api('/api/v1/artists/abigail-mensah');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Awaited<ReturnType<typeof profileData>> };
    const data = body.data;
    expect(data.rating).toBe(4.9);
    expect(data.reviewCount).toBe(38);
    expect(data.reviews.total).toBe(38);
    expect(data.reviews.items).toHaveLength(4);
    expect(data.reviews.items[0]?.stars).toBe(5);
    expect(data.reviews.items[0]?.text).toBe(
      'She had the whole congregation singing in three-part harmony by the last verse.',
    );
    expect(data.reviews.items[0]?.attribution).toEqual({
      reviewerName: 'Rev. Janet Clarke',
      churchName: 'St. Brendan’s Anglican',
      city: 'Oshawa',
      month: '2026-09',
    });
    expect(data.reviews.items[0]?.reply).toBeNull();
    expect(data.reviews.items[1]?.attribution.reviewerName).toBe('Tomi Oduya');
    expect(data.reviews.items[1]?.reply).toEqual({
      text: 'Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov.',
      artistName: 'Abigail Mensah',
      month: '2026-10',
    });
    expect(data.reviews.items[2]?.attribution.reviewerName).toBe('Naomi Fraser');
    expect(data.reviews.items[2]?.reply?.month).toBe('2026-06');
    expect(data.reviews.items[3]?.attribution.reviewerName).toBe('Pastor Femi Adebayo');
    expect(data.reviews.items[3]?.stars).toBe(4);
    expect(data.reviews.items[3]?.attribution.month).toBe('2026-05');
    expect(data.reviews.nextCursor).not.toBeNull();
    expectContract(response, PROFILE, body);
  });

  it('pages through the rest ten at a time, newest first', async () => {
    const first = (await profileData('abigail-mensah')).reviews;
    let cursor = first.nextCursor;
    let ids = first.items.map((review) => review.id);
    let months = first.items.map((review) => review.attribution.month);
    const pageSizes: number[] = [];

    while (cursor !== null) {
      const response = await api(
        `/api/v1/artists/abigail-mensah/reviews?cursor=${encodeURIComponent(cursor)}`,
      );
      expect(response.status).toBe(200);
      const page = (await response.json()) as ReviewPage;
      expect(page.meta.perPage).toBe(10);
      expectContract(response, REVIEWS, page);
      pageSizes.push(page.data.length);
      ids = [...ids, ...page.data.map((review) => review.id)];
      months = [...months, ...page.data.map((review) => review.attribution.month)];
      cursor = page.meta.nextCursor;
    }

    expect(pageSizes).toEqual([10, 10, 10, 4]);
    expect(new Set(ids).size).toBe(38);
    expect([...months].sort().reverse()).toEqual(months);
  });

  it('starts the first page of the reviews endpoint with the newest', async () => {
    const response = await api('/api/v1/artists/abigail-mensah/reviews');

    expect(response.status).toBe(200);
    const page = (await response.json()) as ReviewPage;
    expect(page.data).toHaveLength(10);
    expect(page.data[0]?.attribution.reviewerName).toBe('Rev. Janet Clarke');
    expect(page.meta.nextCursor).not.toBeNull();
    expectContract(response, REVIEWS, page);
  });

  it('shows only public fields on a review', async () => {
    const onProfile = (await profileData('abigail-mensah')).reviews.items;
    const listed = (
      (await (await api('/api/v1/artists/abigail-mensah/reviews')).json()) as ReviewPage
    ).data;

    for (const review of [...onProfile, ...listed]) {
      expect(Object.keys(review).sort()).toEqual([...REVIEW_FIELDS].sort());
      expect(Object.keys(review.attribution).sort()).toEqual([
        'churchName',
        'city',
        'month',
        'reviewerName',
      ]);
    }
    const json = JSON.stringify([...onProfile, ...listed]);
    expect(json).not.toContain('@');
    expect(json).not.toContain('ZAM-');
    expect(json).not.toContain('booker');
    expect(json, 'No event dates.').not.toContain('2026-09-13');
  });

  it('gives a new artist no reviews', async () => {
    expect((await profileData('miriam-haile')).reviews).toEqual({
      total: 0,
      items: [],
      nextCursor: null,
    });

    const response = await api('/api/v1/artists/miriam-haile/reviews');
    expect(response.status).toBe(200);
    const page = (await response.json()) as ReviewPage;
    expect(page.data).toEqual([]);
    expect(page.meta.nextCursor).toBeNull();
    expectContract(response, REVIEWS, page);
  });

  it('leaves a hidden review out of the list and the rating', async () => {
    const abigail = await artistId('abigail-mensah');
    const [booking] = await db()
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.number, 'ZAM-0089'));
    await db()
      .update(reviews)
      .set({ hiddenAt: torontoTime('2026-10-08 12:00:00') })
      .where(eq(reviews.bookingId, booking?.id ?? 0));

    const data = await profileData('abigail-mensah');
    expect(data.reviews.total).toBe(37);
    expect(data.reviews.items[0]?.attribution.reviewerName).toBe('Tomi Oduya');
    const page = (await (await api('/api/v1/artists/abigail-mensah/reviews')).json()) as ReviewPage;
    expect(page.data[0]?.attribution.reviewerName).toBe('Tomi Oduya');

    await recalculateArtistRating(db(), abigail);

    // 180 stars from 37 churches: 4.86 rounds to 4.9.
    const after = await profileData('abigail-mensah');
    expect(after.rating).toBe(4.9);
    expect(after.reviewCount).toBe(37);
  });

  it('rates the mean to one decimal and counts distinct churches', async () => {
    const miriam = await artistId('miriam-haile');
    const churches = [
      'Grace Chapel',
      'Hope Church',
      'Bethel Assembly',
      'Zion Fellowship',
      'Cornerstone Baptist',
      'Grace Chapel',
      'New Life Church',
    ];
    for (const [index, stars] of [5, 5, 5, 5, 5, 5, 4].entries()) {
      await review(
        miriam,
        stars,
        churches[index] ?? '',
        `2026-09-${String(index + 1).padStart(2, '0')} 12:00`,
      );
    }
    await review(miriam, 1, 'Agincourt Community Church', '2026-09-30 12:00', true);

    await recalculateArtistRating(db(), miriam);

    // 34 / 7 = 4.857, shown as 4.9; Grace Chapel reviewed twice, so 6 churches.
    const data = await profileData('miriam-haile');
    expect(data.rating).toBe(4.9);
    expect(data.reviewCount).toBe(6);
    expect(data.reviews.total).toBe(7);
  });

  it("keeps Abigail's rating when the seeded cast is recalculated", async () => {
    await recalculateArtistRating(db(), await artistId('abigail-mensah'));

    const data = await profileData('abigail-mensah');
    expect(data.rating).toBe(4.9);
    expect(data.reviewCount).toBe(38);
  });

  it('gives an artist with every review hidden no rating', async () => {
    const abigail = await artistId('abigail-mensah');
    await db()
      .update(reviews)
      .set({ hiddenAt: torontoTime('2026-10-08 12:00:00') })
      .where(eq(reviews.artistId, abigail));

    await recalculateArtistRating(db(), abigail);

    const data = await profileData('abigail-mensah');
    expect(data.rating).toBeNull();
    expect(data.reviewCount).toBe(0);
    expect(data.reviews.total).toBe(0);
  });

  it('does not find the reviews of a suspended or unknown artist', async () => {
    await db()
      .update(artists)
      .set({ status: 'suspended' })
      .where(eq(artists.slug, 'abigail-mensah'));

    const response = await api('/api/v1/artists/abigail-mensah/reviews');
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    expectContract(response, REVIEWS, await response.json());
    expect((await api('/api/v1/artists/nobody-at-all/reviews')).status).toBe(404);
  });

  it('rejects a cursor that does not decode', async () => {
    const response = await api('/api/v1/artists/abigail-mensah/reviews?cursor=not-a-cursor');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.cursor?.[0]).toBe('These reviews have changed. Reload the page.');
    expectContract(response, REVIEWS, body);
  });
});

async function review(
  artist: number,
  stars: number,
  church: string,
  createdAt: string,
  hidden = false,
): Promise<void> {
  const [booker] = await db()
    .insert(users)
    .values({
      name: 'A Reviewer',
      email: `reviewer-${String(Math.random()).slice(2)}@example.test`,
      password: 'x',
    })
    .returning({ id: users.id });
  const [booking] = await db()
    .insert(bookings)
    .values({
      number: `ZAM-9${String(Math.random()).slice(2, 7)}`,
      artistId: artist,
      status: 'completed',
      eventDate: '2026-08-30',
      kind: 'sunday-service',
      churchName: church,
      churchCity: 'Toronto',
    })
    .returning({ id: bookings.id });
  await db()
    .insert(reviews)
    .values({
      bookingId: booking?.id ?? 0,
      artistId: artist,
      bookerId: booker?.id ?? 0,
      stars,
      text: 'A warm and faithful evening of worship.',
      createdAt: torontoTime(createdAt),
      hiddenAt: hidden ? torontoTime('2026-10-01 09:00:00') : null,
    });
}
