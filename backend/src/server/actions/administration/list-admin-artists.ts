import { and, asc, eq, gte, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artistRatings, artists, artistStyles, bookings, users } from '@/server/db/schema';
import { ArtistStatus, BookingStatus, Style, valuesOf } from '@/server/enums';
import { today } from '@/server/support/clock';

export interface AdminArtistRow {
  id: number;
  name: string;
  slug: string;
  actType: (typeof artists.$inferSelect)['actType'];
  baseCity: string;
  rating: number | null;
  status: ArtistStatus;
}

export interface AdminArtistCounts {
  total: number;
  approved: number;
  suspended: number;
}

export interface UpcomingBooking {
  number: string;
  eventDate: string;
  churchName: string;
  churchCity: string;
  kind: (typeof bookings.$inferSelect)['kind'];
  status: BookingStatus;
}

export interface AdminArtistDetail extends AdminArtistRow {
  email: string;
  styles: Style[];
  fromPriceCents: number;
  approvedAt: Date | null;
  upcomingBookings: UpcomingBooking[];
}

const STYLE_ORDER = valuesOf(Style);

/**
 * The read-only Artists section (pages/admin-artists, pages/admin-artist; L2-067, M3 D18). `q`
 * narrows to artists whose name, base city or account email has a word starting with it ("Tobi"
 * does not match Etobicoke). The counts cover every artist, not the match.
 */
export async function listAdminArtists(
  q: string | undefined,
): Promise<{ artists: AdminArtistRow[]; counts: AdminArtistCounts }> {
  const conditions = [];
  if (q !== undefined && q.trim() !== '') {
    const term = q
      .trim()
      .toLowerCase()
      .replace(/[%_\\]/g, (c) => `\\${c}`);
    const starts = `${term}%`;
    const word = `% ${term}%`;
    conditions.push(
      or(
        sql`(lower(${artists.displayName}) like ${starts} or lower(${artists.displayName}) like ${word})`,
        sql`(lower(${artists.baseCity}) like ${starts} or lower(${artists.baseCity}) like ${word})`,
        sql`(lower(${users.email}) like ${starts} or lower(${users.email}) like ${word})`,
      ),
    );
  }
  const rows = await db()
    .select({
      id: artists.id,
      name: artists.displayName,
      slug: artists.slug,
      actType: artists.actType,
      baseCity: artists.baseCity,
      rating: artistRatings.rating,
      status: artists.status,
    })
    .from(artists)
    .innerJoin(users, eq(users.id, artists.userId))
    .leftJoin(artistRatings, eq(artistRatings.artistId, artists.id))
    .where(conditions.length === 0 ? undefined : and(...conditions))
    .orderBy(asc(artists.displayName));
  const [counts] = await db()
    .select({
      total: sql<number>`count(*)::int`,
      approved: sql<number>`count(*) filter (where ${artists.status} = ${ArtistStatus.Approved})::int`,
      suspended: sql<number>`count(*) filter (where ${artists.status} = ${ArtistStatus.Suspended})::int`,
    })
    .from(artists);
  return {
    artists: rows.map((row) => ({ ...row, rating: row.rating ?? null })),
    counts: counts ?? { total: 0, approved: 0, suspended: 0 },
  };
}

/** One artist: the account, the profile, the bookings still to come and the standing. */
export async function findAdminArtist(id: number): Promise<AdminArtistDetail | null> {
  const [row] = await db()
    .select({
      id: artists.id,
      name: artists.displayName,
      slug: artists.slug,
      actType: artists.actType,
      baseCity: artists.baseCity,
      rating: artistRatings.rating,
      status: artists.status,
      email: users.email,
      fromPriceCents: artists.fromPriceCents,
      approvedAt: artists.approvedAt,
    })
    .from(artists)
    .innerJoin(users, eq(users.id, artists.userId))
    .leftJoin(artistRatings, eq(artistRatings.artistId, artists.id))
    .where(eq(artists.id, id));
  if (row === undefined) return null;
  const [styles, upcoming] = await Promise.all([
    db()
      .select({ style: artistStyles.style })
      .from(artistStyles)
      .where(eq(artistStyles.artistId, id)),
    db()
      .select({
        number: bookings.number,
        eventDate: bookings.eventDate,
        churchName: bookings.churchName,
        churchCity: bookings.churchCity,
        kind: bookings.kind,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.artistId, id),
          inArray(bookings.status, [
            BookingStatus.Requested,
            BookingStatus.Accepted,
            BookingStatus.Confirmed,
          ]),
          gte(bookings.eventDate, today()),
        ),
      )
      .orderBy(asc(bookings.eventDate)),
  ]);
  return {
    ...row,
    rating: row.rating ?? null,
    styles: styles
      .map((entry) => entry.style)
      .sort((a, b) => STYLE_ORDER.indexOf(a) - STYLE_ORDER.indexOf(b)),
    upcomingBookings: upcoming,
  };
}
