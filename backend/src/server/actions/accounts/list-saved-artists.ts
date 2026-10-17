import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import type { DateTime } from 'luxon';
import { db } from '@/server/db/client';
import { artistRatings, artists, artistStyles, churches, savedArtists } from '@/server/db/schema';
import { ArtistStatus, Style, valuesOf } from '@/server/enums';
import { freeArtistIds } from '@/server/services/artist-availability/availability';
import { Coordinates } from '@/server/services/discovery/coordinates';
import type { Distance } from '@/server/services/discovery/distance';
import { distancesFromOrigin } from '@/server/services/discovery/distance-service';
import type { LineupArtist } from '@/server/services/discovery/lineup';

/** One saved artist on the list (accounts/view-saved-artists). */
export interface SavedArtistCard {
  artist: LineupArtist;
  /** From the booker's church; null when they have none yet. */
  distance: Distance | null;
  savedAt: Date;
  /** Free on the date asked for; null when no date was given. */
  free: boolean | null;
}

export interface SavedArtistList {
  cards: SavedArtistCard[];
  date: DateTime | null;
}

const STYLE_ORDER = valuesOf(Style);

/**
 * A booker's saved artists (L2-027): visible artists only, newest save first, each free or booked on
 * the date with one availability query for the whole list, measured from the booker's church. An
 * artist who is suspended stays saved and returns when the suspension is lifted. At most 200, so
 * the list is not paged.
 */
export async function listSavedArtists(
  bookerId: number,
  date: DateTime | null,
): Promise<SavedArtistList> {
  const rows = await db()
    .select({ row: artists, rating: artistRatings, savedAt: savedArtists.createdAt })
    .from(savedArtists)
    .innerJoin(artists, eq(artists.id, savedArtists.artistId))
    .leftJoin(artistRatings, eq(artistRatings.artistId, artists.id))
    .where(
      and(
        eq(savedArtists.userId, bookerId),
        // Shown to the public: approved, payout set up and published (L2-005.4, L2-048.3).
        eq(artists.status, ArtistStatus.Approved),
        eq(artists.payoutReady, true),
        isNotNull(artists.publishedAt),
      ),
    )
    .orderBy(desc(savedArtists.createdAt), desc(savedArtists.id));
  if (rows.length === 0) return { cards: [], date };

  const ids = rows.map(({ row }) => row.id);
  const styleRows = await db()
    .select()
    .from(artistStyles)
    .where(inArray(artistStyles.artistId, ids));
  const stylesByArtist = new Map<number, Style[]>();
  for (const { artistId, style } of styleRows) {
    stylesByArtist.set(artistId, [...(stylesByArtist.get(artistId) ?? []), style]);
  }

  const free = date === null ? null : new Set(await freeArtistIds(ids, date));
  const [church] = await db()
    .select({ latitude: churches.latitude, longitude: churches.longitude })
    .from(churches)
    .where(eq(churches.bookerId, bookerId));
  const distances =
    church === undefined
      ? []
      : await distancesFromOrigin(
          new Coordinates(church.latitude, church.longitude),
          rows.map(({ row }) => new Coordinates(row.baseLatitude, row.baseLongitude)),
        );

  return {
    cards: rows.map(({ row, rating, savedAt }, index) => ({
      artist: {
        row,
        styles: (stylesByArtist.get(row.id) ?? []).sort(
          (a, b) => STYLE_ORDER.indexOf(a) - STYLE_ORDER.indexOf(b),
        ),
        rating,
      },
      distance: distances[index] ?? null,
      savedAt,
      free: free === null ? null : free.has(row.id),
    })),
    date,
  };
}
