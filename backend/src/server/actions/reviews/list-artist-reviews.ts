import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists, bookings, reviewReplies, reviews, users } from '@/server/db/schema';
import { resolveArtistSlug } from '@/server/services/artist-profiles/resolve-artist-slug';

export const REVIEWS_ON_PROFILE = 4;
export const REVIEWS_PER_PAGE = 10;

/** One review with its church snapshot, its reviewer and the artist's reply. */
export interface ReviewRow {
  id: number;
  stars: number;
  text: string;
  createdAt: Date;
  reviewerName: string;
  churchName: string;
  churchCity: string;
  reply: { text: string; artistName: string; createdAt: Date } | null;
}

/** The position to continue after: the last review's `created_at` and id. */
export interface ReviewCursor {
  createdAt: Date;
  id: number;
}

export interface ReviewPage {
  items: ReviewRow[];
  nextCursor: ReviewCursor | null;
}

/**
 * A visible artist's visible reviews, newest first, a page at a time (L2-018, L2-095.1): the
 * profile carries the first 4 and "Show all" fetches 10 more each time. Hidden reviews are never
 * read (L2-062). Throws ArtistMoved or ArtistNotFound.
 */
export async function listArtistReviews(
  slug: string,
  cursor: ReviewCursor | null,
): Promise<ReviewPage> {
  const artist = await resolveArtistSlug(slug);
  return reviewPage(artist.id, REVIEWS_PER_PAGE, cursor);
}

export async function reviewPage(
  artistId: number,
  perPage: number,
  cursor: ReviewCursor | null = null,
): Promise<ReviewPage> {
  const replyArtist = db()
    .select({ id: artists.id, displayName: artists.displayName })
    .from(artists)
    .as('reply_artist');
  const rows = await db()
    .select({
      id: reviews.id,
      stars: reviews.stars,
      text: reviews.text,
      createdAt: reviews.createdAt,
      reviewerName: users.name,
      churchName: bookings.churchName,
      churchCity: bookings.churchCity,
      replyText: reviewReplies.text,
      replyCreatedAt: reviewReplies.createdAt,
      replyArtistName: replyArtist.displayName,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.bookerId))
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .leftJoin(reviewReplies, eq(reviewReplies.reviewId, reviews.id))
    .leftJoin(replyArtist, eq(replyArtist.id, reviewReplies.artistId))
    .where(
      and(
        eq(reviews.artistId, artistId),
        isNull(reviews.hiddenAt),
        cursor === null
          ? undefined
          : or(
              lt(reviews.createdAt, cursor.createdAt),
              and(eq(reviews.createdAt, cursor.createdAt), lt(reviews.id, cursor.id)),
            ),
      ),
    )
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(perPage + 1);

  const page = rows.slice(0, perPage);
  const last = page.at(-1);
  return {
    items: page.map((row) => ({
      id: row.id,
      stars: row.stars,
      text: row.text,
      createdAt: row.createdAt,
      reviewerName: row.reviewerName,
      churchName: row.churchName,
      churchCity: row.churchCity,
      reply:
        row.replyText === null || row.replyCreatedAt === null
          ? null
          : {
              text: row.replyText,
              artistName: row.replyArtistName ?? '',
              createdAt: row.replyCreatedAt,
            },
    })),
    nextCursor:
      rows.length > perPage && last !== undefined
        ? { createdAt: last.createdAt, id: last.id }
        : null,
  };
}

/** How many visible reviews the artist has, for "Show all 38 reviews". */
export async function reviewTotal(artistId: number): Promise<number> {
  const [row] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(and(eq(reviews.artistId, artistId), isNull(reviews.hiddenAt)));
  return row?.count ?? 0;
}

/** An opaque, URL-safe cursor over the reviews' order; another shape does not decode. */
export function encodeReviewCursor(cursor: ReviewCursor): string {
  return Buffer.from(JSON.stringify({ c: cursor.createdAt.toISOString(), i: cursor.id })).toString(
    'base64url',
  );
}

export function decodeReviewCursor(value: string): ReviewCursor | null {
  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const { c, i } = data as { c?: unknown; i?: unknown };
  if (typeof c !== 'string' || typeof i !== 'number' || Number.isNaN(Date.parse(c))) return null;
  return { createdAt: new Date(c), id: i };
}
