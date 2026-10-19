import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, map, type Observable, of, throwError } from 'rxjs';
import type {
  ArtistCalendar,
  ArtistCalendarDay,
  CalendarFeed,
  DateRange,
  RangeResult,
  RangeWarning,
} from '../models/artist-calendar';

/** The signed-in artist's own calendar (L2-056). Pages depend on the token, never the implementation. */
export interface ArtistCalendarApi {
  /** One month (`YYYY-MM`) of the calendar, or the current month without one. */
  month(month: string | null): Observable<ArtistCalendar>;
  /**
   * Marks a range Unavailable or Free. Marking Unavailable over open requests answers a warning
   * until the range is sent again with `confirm` (L2-057.2).
   */
  setDates(range: DateRange): Observable<RangeResult | RangeWarning>;
  /** Replaces the weekly default: the ISO weekdays (1 is Monday) the artist is unavailable. */
  setWeekly(unavailableWeekdays: number[]): Observable<number[]>;
  /** The secret calendar feed, or null before it is turned on (L2-058). */
  feed(): Observable<CalendarFeed | null>;
  /** Turns the feed on, or answers the current link. */
  enableFeed(): Observable<CalendarFeed>;
  /** A new secret link; the old one stops working at once (L2-058.2). */
  regenerateFeed(): Observable<CalendarFeed>;
}

export const ARTIST_CALENDAR_API = new InjectionToken<ArtistCalendarApi>('ArtistCalendarApi');

interface CalendarResponse {
  data: { month: string; days: ArtistCalendarDay[] };
  meta: {
    window: { from: string; to: string; until: string };
    weeklyDefault: { unavailableWeekdays: number[] };
  };
}

/** The 409 the API answers while open requests sit in the range. */
export function isRangeWarning(result: RangeResult | RangeWarning): result is RangeWarning {
  return 'affectedRequests' in result;
}

/** Browser only: the calendar is private to the artist and never rendered on the server (ADR-0017). */
@Injectable()
export class HttpArtistCalendarApi implements ArtistCalendarApi {
  private readonly http = inject(HttpClient);

  month(month: string | null): Observable<ArtistCalendar> {
    return this.http
      .get<CalendarResponse>('/api/v1/artist/calendar', { params: month ? { month } : {} })
      .pipe(
        map((response) => ({
          month: response.data.month,
          days: response.data.days,
          window: response.meta.window,
          unavailableWeekdays: response.meta.weeklyDefault.unavailableWeekdays,
        })),
      );
  }

  setDates(range: DateRange): Observable<RangeResult | RangeWarning> {
    return this.http
      .put<{ data: RangeResult }>('/api/v1/artist/availability/dates', {
        from: range.from,
        to: range.to,
        state: range.state,
        note: range.note ?? null,
        confirm: range.confirm ?? false,
      })
      .pipe(
        map((response): RangeResult | RangeWarning => response.data),
        catchError((error: unknown) => {
          const warning =
            error instanceof HttpErrorResponse &&
            error.status === 409 &&
            String(error.error?.type ?? '').endsWith('/open-requests-affected')
              ? (error.error as RangeWarning)
              : null;
          return warning
            ? of({ affectedRequests: warning.affectedRequests })
            : throwError(() => error);
        }),
      );
  }

  setWeekly(unavailableWeekdays: number[]): Observable<number[]> {
    return this.http
      .put<{
        data: { unavailableWeekdays: number[] };
      }>('/api/v1/artist/availability/weekly', { unavailableWeekdays })
      .pipe(map((response) => response.data.unavailableWeekdays));
  }

  feed(): Observable<CalendarFeed | null> {
    return this.http.get<{ data: CalendarFeed }>('/api/v1/artist/calendar-feed').pipe(
      map((response): CalendarFeed | null => response.data),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(null)
          : throwError(() => error),
      ),
    );
  }

  enableFeed(): Observable<CalendarFeed> {
    return this.http
      .post<{ data: CalendarFeed }>('/api/v1/artist/calendar-feed', {})
      .pipe(map((response) => response.data));
  }

  regenerateFeed(): Observable<CalendarFeed> {
    return this.http
      .post<{ data: CalendarFeed }>('/api/v1/artist/calendar-feed/regeneration', {})
      .pipe(map((response) => response.data));
  }
}
