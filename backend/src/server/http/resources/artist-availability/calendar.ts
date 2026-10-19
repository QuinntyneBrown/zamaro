import { z } from 'zod';
import { GatheringKind, valuesOf } from '@/server/enums';
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
  /** The gathering and the church's city of that booking or request. */
  kind: z.enum(valuesOf(GatheringKind)).nullable(),
  city: z.string().nullable(),
  /** For an Unavailable day: the weekly default, or her own choice of that date. */
  cause: z.enum(['weekly-default', 'chosen']).nullable(),
  /** Her private note on a date she chose. */
  note: z.string().nullable(),
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
        kind: day.kind,
        city: day.city,
        cause: day.cause,
        note: day.note,
      })),
    },
    meta: { window },
  };
}
