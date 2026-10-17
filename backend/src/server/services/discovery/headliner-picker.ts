import { and, desc, eq, gte, inArray, isNull, ne, sql } from 'drizzle-orm';
import type { DateTime } from 'luxon';
import { db } from '@/server/db/client';
import { bookings, bookingTransitions, reviews, users } from '@/server/db/schema';
import type { HeadlinerQuote, LineupCard } from './lineup';
import { compareKeys } from './lineup-sorter';
import { seasonStart } from './season';

/**
 * The headliner (L2-006): among the results, the artist with the most bookings confirmed since the
 * start of the current season, not counting bookings since cancelled; ties go to the higher rating,
 * then the shorter distance, then the lower artist id.
 */
export async function pickHeadliner(
  cards: LineupCard[],
  today: DateTime,
): Promise<LineupCard | null> {
  if (cards.length === 0) return null;
  const confirmed = await confirmedThisSeason(
    cards.map((card) => card.artist.row.id),
    today,
  );
  // Higher ranks first: more bookings, higher rating, shorter distance, lower id.
  const rank = (card: LineupCard): number[] => [
    -(confirmed.get(card.artist.row.id) ?? 0),
    -(card.artist.rating?.rating ?? 0),
    card.distance.km,
    card.artist.row.id,
  ];
  return [...cards].sort((a, b) => compareKeys(rank(a), rank(b)))[0] ?? null;
}

export const QUOTE_MAX_LENGTH = 160;

export async function quoteFor(headliner: LineupCard): Promise<HeadlinerQuote | null> {
  const [review] = await db()
    .select({ text: reviews.text, reviewerName: users.name, city: bookings.churchCity })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.bookerId))
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .where(
      and(
        eq(reviews.artistId, headliner.artist.row.id),
        eq(reviews.stars, 5),
        isNull(reviews.hiddenAt),
      ),
    )
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(1);
  return review === undefined
    ? null
    : { text: excerpt(review.text), reviewerName: review.reviewerName, city: review.city };
}

/** The first 160 characters, cut at a word boundary, with an ellipsis. */
export function excerpt(text: string): string {
  const characters = Array.from(text);
  if (characters.length <= QUOTE_MAX_LENGTH) return text;
  const cut = characters.slice(0, QUOTE_MAX_LENGTH).join('');
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace < 0 ? cut : cut.slice(0, lastSpace)}…`;
}

/** Artist id => bookings confirmed this season. */
async function confirmedThisSeason(
  artistIds: number[],
  today: DateTime,
): Promise<Map<number, number>> {
  const rows = await db()
    .select({
      artistId: bookings.artistId,
      confirmed: sql<number>`count(distinct ${bookings.id})::int`,
    })
    .from(bookings)
    .innerJoin(bookingTransitions, eq(bookingTransitions.bookingId, bookings.id))
    .where(
      and(
        inArray(bookings.artistId, artistIds),
        eq(bookingTransitions.toStatus, 'confirmed'),
        gte(bookingTransitions.occurredAt, seasonStart(today).toJSDate()),
        ne(bookings.status, 'cancelled'),
      ),
    )
    .groupBy(bookings.artistId);
  return new Map(rows.map((row) => [row.artistId, row.confirmed]));
}
