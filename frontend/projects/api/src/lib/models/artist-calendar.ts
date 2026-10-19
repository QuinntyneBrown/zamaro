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

/** A range of dates to mark Unavailable or Free (L2-056.3). */
export interface DateRange {
  from: CalendarDate;
  to: CalendarDate;
  state: 'unavailable' | 'free';
  /** The artist's private note, up to 100 characters. */
  note?: string | null;
  /** True once the artist has seen the warning about open requests (L2-057.2). */
  confirm?: boolean;
}

/** What a saved range changed. */
export interface RangeResult {
  /** The dates saved, in order. */
  changedDates: CalendarDate[];
  /** Confirmed dates in the range, which stay Booked (L2-057.1). */
  skippedDates: CalendarDate[];
  /** Open requests declined because the artist confirmed. */
  declinedCount: number;
}

/** An open request on a date in the range the artist is marking Unavailable. */
export interface AffectedRequest {
  booking: string;
  date: CalendarDate;
  church: string;
}

/** The API's refusal to mark the range until the artist confirms: churches have asked (L2-057.2). */
export interface RangeWarning {
  affectedRequests: AffectedRequest[];
}

/** The artist's secret calendar feed, once it is on (L2-058). */
export interface CalendarFeed {
  url: string;
  enabledAt: string;
  regeneratedAt: string | null;
}
