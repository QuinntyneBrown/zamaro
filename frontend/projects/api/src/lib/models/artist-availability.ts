import type { CalendarDate } from '../i18n/calendar-date';
import type { GatheringKind } from './discovery';

/** One row of an artist's "On tour" list (L2-017). */
export interface TourDate {
  date: CalendarDate;
  status: 'free' | 'booked';
  /** On a booked date only: the kind of gathering. */
  kind: GatheringKind | null;
  /** On a booked date only: the church's city, never its name or address (L2-083). */
  city: string | null;
}

/** The booking stub's date check (L2-019). */
export interface DateCheck {
  date: CalendarDate;
  free: boolean;
  /** On a free date, the last day a booking on it could be cancelled for free (L2-044). */
  freeCancellationUntil: CalendarDate | null;
}

/** A date outside the booking window, with the reason the API gave (a 422). */
export interface DateRefused {
  date: CalendarDate;
  /** "Pick a date at least 3 days away." */
  refused: string;
}
