import { and, between, eq, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/server/db/client';
import { artists, availabilityOverrides, bookings } from '@/server/db/schema';
import { BookingStatus, OverrideState } from '@/server/enums';
import { ownArtistId } from '@/server/services/artist-availability/own-artist';
import { transitionBooking } from '@/server/services/bookings/state-machine';
import { ZONE } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export interface DateRange {
  from: string;
  to: string;
  state: OverrideState;
  note: string | null;
  confirm: boolean;
}

export interface RangeResult {
  changedDates: string[];
  /** Confirmed dates, which the artist cannot change (L2-057.1). */
  skippedDates: string[];
  declinedCount: number;
}

/** What the booker is told when a request is declined by the artist's calendar (L2-030). */
export const NOT_FREE_REASON = 'I’m not free that day';

/**
 * The artist marks a range of dates unavailable or free (L2-056.3). Inside one transaction with the
 * artist locked, so a concurrent request or confirmation sees one state: Confirmed dates are
 * skipped; marking dates unavailable that hold open requests, Requested or Accepted, answers 409
 * with `affectedRequests` until `confirm` is set, and then declines each of them (L2-057.2). The
 * bookers' emails belong to the respond-to-request journey.
 *
 * @throws HttpProblem NotFound for a non-artist, or OpenRequestsAffected until the artist confirms
 */
export async function setDateAvailability(userId: number, range: DateRange): Promise<RangeResult> {
  return db().transaction(async (tx) => {
    const artistId = await ownArtistId(userId, tx);
    await tx.select({ id: artists.id }).from(artists).where(eq(artists.id, artistId)).for('update');

    const held = await tx
      .select({
        id: bookings.id,
        number: bookings.number,
        status: bookings.status,
        date: bookings.eventDate,
        church: bookings.churchName,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.artistId, artistId),
          inArray(bookings.status, [
            BookingStatus.Requested,
            BookingStatus.Accepted,
            BookingStatus.Confirmed,
          ]),
          between(bookings.eventDate, range.from, range.to),
        ),
      )
      .orderBy(bookings.eventDate, bookings.number);
    const skipped = new Set(
      held.filter((b) => b.status === BookingStatus.Confirmed).map((b) => b.date),
    );
    const open =
      range.state === OverrideState.Unavailable
        ? held.filter((b) => b.status !== BookingStatus.Confirmed && !skipped.has(b.date))
        : [];
    if (open.length > 0 && !range.confirm) {
      const churches = new Set(open.map((b) => b.church)).size;
      throw new HttpProblem(ProblemType.OpenRequestsAffected, {
        detail:
          open.length === 1
            ? '1 church has asked about these dates. They’ll be told you’re not available.'
            : `${String(churches)} churches have asked about these dates. They’ll be told you’re not available.`,
        extensions: {
          affectedRequests: open.map((b) => ({
            booking: b.number,
            date: b.date,
            church: b.church,
          })),
        },
      });
    }

    const changedDates = datesOf(range).filter((date) => !skipped.has(date));
    if (changedDates.length > 0) {
      await tx
        .insert(availabilityOverrides)
        .values(
          changedDates.map((date) => ({
            artistId,
            date,
            state: range.state,
            note: range.note,
          })),
        )
        .onConflictDoUpdate({
          target: [availabilityOverrides.artistId, availabilityOverrides.date],
          set: { state: range.state, note: range.note },
        });
    }
    for (const booking of open) {
      await transitionBooking(
        tx,
        booking,
        BookingStatus.Declined,
        { kind: 'artist', id: userId },
        NOT_FREE_REASON,
      );
    }
    return { changedDates, skippedDates: [...skipped].sort(), declinedCount: open.length };
  });
}

/** Every `YYYY-MM-DD` from the first to the last day, inclusive. */
function datesOf(range: Pick<DateRange, 'from' | 'to'>): string[] {
  const dates: string[] = [];
  const last = DateTime.fromISO(range.to, { zone: ZONE });
  for (
    let day = DateTime.fromISO(range.from, { zone: ZONE });
    day <= last;
    day = day.plus({ days: 1 })
  ) {
    dates.push(day.toISODate() ?? '');
  }
  return dates;
}
