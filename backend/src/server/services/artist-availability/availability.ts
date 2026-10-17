import { and, between, eq, exists, gte, inArray, isNull, not, or, sql } from 'drizzle-orm';
import type { DateTime } from 'luxon';
import { db, type Database, type Transaction } from '@/server/db/client';
import {
  artists,
  availabilityOverrides,
  availabilityRules,
  bookings,
  vulnerableSectorChecks,
} from '@/server/db/schema';
import { GatheringKind, type TourDateStatus } from '@/server/enums';

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

/** One row of the "On tour" list (L2-017). A booked date names only the gathering and the church's city. */
export interface TourDate {
  date: string;
  status: TourDateStatus;
  kind: GatheringKind | null;
  city: string | null;
}

/**
 * The artist's free and booked days from `from` to `until`, in date order; days marked unavailable
 * are skipped (L2-017). Reads the weekly rules, the dated overrides and the Confirmed bookings once
 * each, so callers can stop early without a query per day.
 */
export async function* tourDays(
  artistId: number,
  from: DateTime,
  until: DateTime,
  database: Database | Transaction = db(),
): AsyncGenerator<TourDate> {
  const range: [string, string] = [from.toISODate() ?? '', until.toISODate() ?? ''];
  const unavailableWeekdays = new Set(
    (
      await database
        .select({ weekday: availabilityRules.weekday })
        .from(availabilityRules)
        .where(
          and(eq(availabilityRules.artistId, artistId), eq(availabilityRules.unavailable, true)),
        )
    ).map((row) => row.weekday),
  );
  const overrides = new Map(
    (
      await database
        .select({ date: availabilityOverrides.date, state: availabilityOverrides.state })
        .from(availabilityOverrides)
        .where(
          and(
            eq(availabilityOverrides.artistId, artistId),
            between(availabilityOverrides.date, range[0], range[1]),
          ),
        )
    ).map((row) => [row.date, row.state]),
  );
  const booked = new Map(
    (
      await database
        .select({ date: bookings.eventDate, kind: bookings.kind, city: bookings.churchCity })
        .from(bookings)
        .where(
          and(
            eq(bookings.artistId, artistId),
            eq(bookings.status, 'confirmed'),
            between(bookings.eventDate, range[0], range[1]),
          ),
        )
    ).map((row) => [row.date, row]),
  );

  for (let date = from; date <= until; date = date.plus({ days: 1 })) {
    const day = date.toISODate() ?? '';
    const booking = booked.get(day);
    if (booking !== undefined) {
      yield { date: day, status: 'booked', kind: booking.kind, city: booking.city };
      continue;
    }
    const override = overrides.get(day);
    const free =
      override !== undefined ? override === 'free' : !unavailableWeekdays.has(date.weekday);
    if (free) yield { date: day, status: 'free', kind: null, city: null };
  }
}
