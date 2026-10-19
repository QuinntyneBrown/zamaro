import { and, asc, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/server/db/client';
import { availabilityRules } from '@/server/db/schema';
import { dayStatuses, type CalendarDay } from '@/server/services/artist-availability/availability';
import { latestBookable } from '@/server/services/artist-availability/booking-window';
import { ownArtistId } from '@/server/services/artist-availability/own-artist';
import { now, ZONE } from '@/server/support/clock';

export interface ArtistCalendar {
  month: string;
  days: CalendarDay[];
  /** The ISO weekdays (1 is Monday) the artist is unavailable by default, ascending. */
  unavailableWeekdays: number[];
}

export interface CalendarWindow {
  /** The pager's first and last month, `YYYY-MM`: this month to the month of the last bookable date. */
  from: string;
  to: string;
  /** The last date a church can ask for, `YYYY-MM-DD` (L2-004). */
  until: string;
}

/** This month, `YYYY-MM`, in Toronto. */
export function currentMonth(): string {
  return now().setZone(ZONE).toFormat('yyyy-MM');
}

export function calendarWindow(): CalendarWindow {
  const last = latestBookable();
  return { from: currentMonth(), to: last.toFormat('yyyy-MM'), until: last.toISODate() ?? '' };
}

/** One month of the signed-in artist's own calendar (L2-056.1); anyone else has no calendar (L2-074). */
export async function buildArtistCalendar(userId: number, month: string): Promise<ArtistCalendar> {
  const artistId = await ownArtistId(userId);
  const first = DateTime.fromFormat(month, 'yyyy-MM', { zone: ZONE });
  const rules = await db()
    .select({ weekday: availabilityRules.weekday })
    .from(availabilityRules)
    .where(and(eq(availabilityRules.artistId, artistId), eq(availabilityRules.unavailable, true)))
    .orderBy(asc(availabilityRules.weekday));
  return {
    month,
    days: await dayStatuses(artistId, first, first.endOf('month').startOf('day')),
    unavailableWeekdays: rules.map((rule) => rule.weekday),
  };
}
