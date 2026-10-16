import { and, eq, exists, gte, inArray, isNull, not, or, sql } from 'drizzle-orm';
import type { DateTime } from 'luxon';
import { db, type Database, type Transaction } from '@/server/db/client';
import {
  artists,
  availabilityOverrides,
  availabilityRules,
  bookings,
  vulnerableSectorChecks,
} from '@/server/db/schema';
import { GatheringKind } from '@/server/enums';

/**
 * Free on a date (L2-005): the artist has not marked the date unavailable (a dated override beats the
 * weekly rule) and has no Confirmed booking that day; Requested and Accepted requests do not block.
 * Youth events also need a verified Vulnerable Sector Check still valid on the event date.
 */
export async function freeArtistIds(
  artistIds: number[],
  date: DateTime,
  kind?: GatheringKind,
  database: Database | Transaction = db(),
): Promise<number[]> {
  if (artistIds.length === 0) return [];
  const day = date.toISODate() ?? '';
  const conditions = [
    inArray(artists.id, artistIds),
    or(
      eq(availabilityOverrides.state, 'free'),
      and(
        isNull(availabilityOverrides.state),
        or(isNull(availabilityRules.unavailable), eq(availabilityRules.unavailable, false)),
      ),
    ),
    not(
      exists(
        database
          .select({ one: sql`1` })
          .from(bookings)
          .where(
            and(
              eq(bookings.artistId, artists.id),
              eq(bookings.eventDate, day),
              eq(bookings.status, 'confirmed'),
            ),
          ),
      ),
    ),
  ];
  if (kind === GatheringKind.YouthEvent) {
    conditions.push(
      exists(
        database
          .select({ one: sql`1` })
          .from(vulnerableSectorChecks)
          .where(
            and(
              eq(vulnerableSectorChecks.userId, artists.userId),
              eq(vulnerableSectorChecks.status, 'verified'),
              gte(vulnerableSectorChecks.expiresOn, day),
            ),
          ),
      ),
    );
  }
  const rows = await database
    .select({ id: artists.id })
    .from(artists)
    .leftJoin(
      availabilityOverrides,
      and(eq(availabilityOverrides.artistId, artists.id), eq(availabilityOverrides.date, day)),
    )
    .leftJoin(
      availabilityRules,
      and(eq(availabilityRules.artistId, artists.id), eq(availabilityRules.weekday, date.weekday)),
    )
    .where(and(...conditions));
  return rows.map((row) => row.id);
}
