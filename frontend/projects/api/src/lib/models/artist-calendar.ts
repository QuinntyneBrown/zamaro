import type { CalendarDate } from '../i18n/calendar-date';
import type { GatheringKind } from './discovery';

/** A day's status on the artist's own calendar (L2-056.1). */
export type CalendarDayStatus = 'free' | 'unavailable' | 'requested' | 'booked';

/** One day of the artist's calendar, as `GET /api/v1/artist/calendar` answers it. */
export interface ArtistCalendarDay {
  date: CalendarDate;
  status: CalendarDayStatus;
  /** Open requests (Requested or Accepted) for the date. */
  requestCount: number;
  /** False for a Booked day, which the artist cannot change (L2-057.1). */
  editable: boolean;
  /** The church of the booking or first request; private to the artist. */
  church: string | null;
  /** The gathering and the church's city of that booking or request. */
  kind: GatheringKind | null;
  city: string | null;
  /** For an Unavailable day: the weekly default, or the artist's own choice of that date. */
  cause: 'weekly-default' | 'chosen' | null;
  /** The artist's private note on a date they chose. */
  note: string | null;
}

/** A month of the artist's calendar with the pager window and the weekly default. */
export interface ArtistCalendar {
  /** `YYYY-MM`. */
  month: string;
  days: ArtistCalendarDay[];
  /** The pager's first and last month (`YYYY-MM`) and the last date a church can ask for. */
  window: { from: string; to: string; until: CalendarDate };
  /** The ISO weekdays (1 is Monday) the artist is unavailable by default, ascending (L2-056.2). */
  unavailableWeekdays: number[];
}
