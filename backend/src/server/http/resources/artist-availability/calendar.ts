import { z } from 'zod';
import type { ArtistCalendar } from '@/server/actions/artist-availability/build-artist-calendar';

const Month = z.string().regex(/^\d{4}-\d{2}$/);

export const CalendarDayResource = z.object({
  date: z.iso.date(),
  status: z.enum(['free', 'unavailable', 'requested', 'booked']),
  /** Open requests (Requested or Accepted) for the date. */
  requestCount: z.number().int(),
  /** False for a Booked day, which the artist cannot change (L2-057.1). */
  editable: z.boolean(),
  /** The church of the booking or first request; private to the artist. */
  church: z.string().nullable(),
});

export const CalendarResource = z.object({
  data: z.object({ month: Month, days: z.array(CalendarDayResource) }),
  meta: z.object({ window: z.object({ from: Month, to: Month }) }),
});

export function toCalendarResource(
  calendar: ArtistCalendar,
  window: { from: string; to: string },
): z.infer<typeof CalendarResource> {
  return {
    data: {
      month: calendar.month,
      days: calendar.days.map((day) => ({
        date: day.date,
        status: day.status,
        requestCount: day.requestCount,
        editable: day.status !== 'booked',
        church: day.church,
      })),
    },
    meta: { window },
  };
}
