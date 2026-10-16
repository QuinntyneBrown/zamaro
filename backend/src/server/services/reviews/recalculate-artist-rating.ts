import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Database, Transaction } from '@/server/db/client';
import { artistRatings, bookings, reviews } from '@/server/db/schema';
import { now } from '@/server/support/clock';

/**
 * Rewrites an artist's rating summary from their visible reviews (L2-060): the mean of the stars
 * rounded to one decimal (4.86 → 4.9), and the number of distinct churches that left one. Until
 * churches have their own records, a church is the booking's name and city.
 */
export async function recalculateArtistRating(
  db: Database | Transaction,
  artistId: number,
): Promise<void> {
  const [summary] = await db
    .select({
      mean: sql<string | null>`avg(${reviews.stars})`,
      churches: sql<number>`count(distinct (${bookings.churchName}, ${bookings.churchCity}))::int`,
    })
    .from(reviews)
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .where(and(eq(reviews.artistId, artistId), isNull(reviews.hiddenAt)));
  const churches = summary?.churches ?? 0;
  const rating =
    churches === 0 || summary?.mean === null || summary?.mean === undefined
      ? null
      : Math.round(Number(summary.mean) * 10) / 10;

  await db
    .insert(artistRatings)
    .values({ artistId, rating, reviewCount: churches, recalculatedAt: now().toJSDate() })
    .onConflictDoUpdate({
      target: artistRatings.artistId,
      set: { rating, reviewCount: churches, recalculatedAt: now().toJSDate() },
    });
}
