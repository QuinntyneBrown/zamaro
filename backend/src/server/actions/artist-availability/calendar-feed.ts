import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists, bookings, calendarFeeds } from '@/server/db/schema';
import { BookingStatus } from '@/server/enums';
import {
  feedUrlFromEncrypted,
  hashFeedToken,
  newFeedToken,
  TOKEN_PATTERN,
} from '@/server/services/artist-availability/feed-token';
import { type FeedEvent, writeCalendar } from '@/server/services/artist-availability/icalendar';
import { ownArtistId } from '@/server/services/artist-availability/own-artist';
import { catalogueMessages } from '@/server/services/user-experience/catalogue';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export interface CalendarFeedState {
  url: string;
  enabledAt: Date;
  regeneratedAt: Date | null;
}

/** The artist's feed as it stands, or null before it is turned on. */
export async function showCalendarFeed(userId: number): Promise<CalendarFeedState | null> {
  const artistId = await ownArtistId(userId);
  const [feed] = await db()
    .select()
    .from(calendarFeeds)
    .where(eq(calendarFeeds.artistId, artistId));
  return feed ? state(feed) : null;
}

/**
 * Turns the feed on with a new token (L2-058.1). Turning on a feed that exists answers the current
 * link unchanged; `created` tells the route which it was.
 */
export async function enableCalendarFeed(
  userId: number,
): Promise<{ feed: CalendarFeedState; created: boolean }> {
  const artistId = await ownArtistId(userId);
  return db().transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(calendarFeeds)
      .where(eq(calendarFeeds.artistId, artistId));
    if (existing) return { feed: state(existing), created: false };
    const token = newFeedToken();
    const [created] = await tx
      .insert(calendarFeeds)
      .values({
        artistId,
        tokenHash: token.hash,
        tokenEncrypted: token.encrypted,
        enabledAt: now().toJSDate(),
      })
      .onConflictDoNothing({ target: calendarFeeds.artistId })
      .returning();
    if (created === undefined) {
      const [raced] = await tx
        .select()
        .from(calendarFeeds)
        .where(eq(calendarFeeds.artistId, artistId));
      if (raced === undefined) throw new Error('The feed could not be saved.');
      return { feed: state(raced), created: false };
    }
    return { feed: state(created), created: true };
  });
}

/**
 * Replaces the token in one update, so the old link answers 404 from the next request (L2-058.2).
 * There is no feed to replace before it is turned on.
 */
export async function regenerateCalendarFeed(userId: number): Promise<CalendarFeedState> {
  const artistId = await ownArtistId(userId);
  const token = newFeedToken();
  const [updated] = await db()
    .update(calendarFeeds)
    .set({
      tokenHash: token.hash,
      tokenEncrypted: token.encrypted,
      regeneratedAt: now().toJSDate(),
    })
    .where(eq(calendarFeeds.artistId, artistId))
    .returning();
  if (updated === undefined) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'The calendar feed is not on.' });
  }
  return state(updated);
}

/**
 * The feed a calendar application polls: the artist's Confirmed and Completed bookings as events,
 * found by the token's hash alone. An unknown token, or one that was replaced, is a 404.
 */
export async function buildCalendarFeed(token: string): Promise<string> {
  if (!TOKEN_PATTERN.test(token)) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No calendar feed answers this link.' });
  }
  const [feed] = await db()
    .select({ artistId: calendarFeeds.artistId, name: artists.displayName })
    .from(calendarFeeds)
    .innerJoin(artists, eq(artists.id, calendarFeeds.artistId))
    .where(eq(calendarFeeds.tokenHash, hashFeedToken(token)));
  if (feed === undefined) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No calendar feed answers this link.' });
  }
  const rows = await db()
    .select({
      number: bookings.number,
      date: bookings.eventDate,
      kind: bookings.kind,
      church: bookings.churchName,
      city: bookings.churchCity,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.artistId, feed.artistId),
        inArray(bookings.status, [BookingStatus.Confirmed, BookingStatus.Completed]),
      ),
    )
    .orderBy(asc(bookings.eventDate), asc(bookings.id));
  const kinds = catalogueMessages('en');
  const events: FeedEvent[] = rows.map((row) => ({
    uid: row.number,
    date: row.date,
    // Bookings carry no start time until requests land (journey 3): all day for now (ADR-0032).
    startTime: null,
    summary: `${kinds[`discover.kind.${row.kind}`] ?? row.kind} · ${row.church}`,
    location: `${row.church}, ${row.city}`,
    description: `Booking ${row.number} on Zamaro.`,
  }));
  return writeCalendar(`${feed.name} · Zamaro bookings`, events, now());
}

function state(feed: typeof calendarFeeds.$inferSelect): CalendarFeedState {
  return {
    url: feedUrlFromEncrypted(feed.tokenEncrypted),
    enabledAt: feed.enabledAt,
    regeneratedAt: feed.regeneratedAt,
  };
}
