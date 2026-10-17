import { and, between, eq, exists, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artistRatings, artists, artistStyles } from '@/server/db/schema';
import { Style, valuesOf } from '@/server/enums';
import { Coordinates } from './coordinates';
import { distancesFromOrigin } from './distance-service';
import {
  UNDER_PRICE_CENTS,
  type LineupArtist,
  type LineupCard,
  type SearchCriteria,
} from './lineup';

/**
 * Visible artists who pass the filters and lie inside a bounding box of a radius around the event,
 * each measured once by road. Distance does not depend on the date, so one measurement serves the
 * search and every alternative date and radius.
 */
const KM_PER_DEGREE_LATITUDE = 111;
const STYLE_ORDER = valuesOf(Style);

/** Keyed by artist id, not yet checked against the travel rule. */
export async function measuredCandidates(
  criteria: SearchCriteria,
  boxRadiusKm: number,
): Promise<Map<number, LineupCard>> {
  const { location, filter } = criteria;
  const latitudeSpan = boxRadiusKm / KM_PER_DEGREE_LATITUDE;
  const longitudeSpan =
    boxRadiusKm / (KM_PER_DEGREE_LATITUDE * Math.cos((location.latitude * Math.PI) / 180));
  const conditions = [
    // Shown to the public: approved, payout set up and published (L2-005.4, L2-048.3).
    eq(artists.status, 'approved'),
    eq(artists.payoutReady, true),
    isNotNull(artists.publishedAt),
    // Road distance is never shorter than the straight line, so nothing in range lies outside this box.
    between(
      artists.baseLatitude,
      location.latitude - latitudeSpan,
      location.latitude + latitudeSpan,
    ),
    between(
      artists.baseLongitude,
      location.longitude - longitudeSpan,
      location.longitude + longitudeSpan,
    ),
  ];
  if (filter.styles.length > 0) {
    conditions.push(
      exists(
        db()
          .select({ one: sql`1` })
          .from(artistStyles)
          .where(
            and(eq(artistStyles.artistId, artists.id), inArray(artistStyles.style, filter.styles)),
          ),
      ),
    );
  }
  if (filter.under800) conditions.push(lt(artists.fromPriceCents, UNDER_PRICE_CENTS));

  const rows = await db()
    .select({ row: artists, rating: artistRatings })
    .from(artists)
    .leftJoin(artistRatings, eq(artistRatings.artistId, artists.id))
    .where(and(...conditions))
    .orderBy(artists.id);
  if (rows.length === 0) return new Map();

  const ids = rows.map(({ row }) => row.id);
  const styleRows = await db()
    .select()
    .from(artistStyles)
    .where(inArray(artistStyles.artistId, ids));
  const stylesByArtist = new Map<number, Style[]>();
  for (const { artistId, style } of styleRows) {
    stylesByArtist.set(artistId, [...(stylesByArtist.get(artistId) ?? []), style]);
  }

  const candidates: LineupArtist[] = rows.map(({ row, rating }) => ({
    row,
    rating,
    // In the chips' order, so every card and profile lists them alike.
    styles: (stylesByArtist.get(row.id) ?? []).sort(
      (a, b) => STYLE_ORDER.indexOf(a) - STYLE_ORDER.indexOf(b),
    ),
  }));
  const distances = await distancesFromOrigin(
    location,
    candidates.map(({ row }) => new Coordinates(row.baseLatitude, row.baseLongitude)),
  );
  return new Map(
    candidates.map((artist, index) => [
      artist.row.id,
      { artist, distance: distances[index] ?? { km: 0, driveMinutes: 0, approximate: true } },
    ]),
  );
}
