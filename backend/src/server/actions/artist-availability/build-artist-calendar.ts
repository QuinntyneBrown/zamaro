import { DateTime } from 'luxon';
import { dayStatuses, type CalendarDay } from '@/server/services/artist-availability/availability';
import { latestBookable } from '@/server/services/artist-availability/booking-window';
import { ownArtistId } from '@/server/services/artist-availability/own-artist';
import { now, ZONE } from '@/server/support/clock';

export interface ArtistCalendar {
  month: string;
  days: CalendarDay[];
}

/** This month, `YYYY-MM`, in Toronto. */
export function currentMonth(): string {
  return now().setZone(ZONE).toFormat('yyyy-MM');
}

/** The pager's first and last month, `YYYY-MM`: this month to the month of the last bookable date. */
export function calendarWindow(): { from: string; to: string } {
  return { from: currentMonth(), to: latestBookable().toFormat('yyyy-MM') };
}

/** One month of the signed-in artist's own calendar (L2-056.1); anyone else has no calendar (L2-074). */
export async function buildArtistCalendar(userId: number, month: string): Promise<ArtistCalendar> {
  const artistId = await ownArtistId(userId);
  const first = DateTime.fromFormat(month, 'yyyy-MM', { zone: ZONE });
  return { month, days: await dayStatuses(artistId, first, first.endOf('month').startOf('day')) };
}
