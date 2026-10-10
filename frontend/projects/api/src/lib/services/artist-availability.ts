import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, map, type Observable, of, throwError } from 'rxjs';
import type { CalendarDate } from '../i18n/calendar-date';
import type { DateCheck, DateRefused, TourDate } from '../models/artist-availability';

/** An artist's free and booked dates. Pages depend on the token, never the implementation. */
export interface ArtistAvailabilityApi {
  /** The next 6 free or booked dates from `from`, or from 3 days from today without it. */
  tourDates(slug: string, from: CalendarDate | null): Observable<TourDate[]>;
  /** Whether the artist is free on `date`, or why the date cannot be booked at all. */
  check(slug: string, date: CalendarDate): Observable<DateCheck | DateRefused>;
}

export const ARTIST_AVAILABILITY_API = new InjectionToken<ArtistAvailabilityApi>(
  'ArtistAvailabilityApi',
);

/** Fetched while rendering on the server, the tour dates reach the browser in the transfer cache. */
@Injectable()
export class HttpArtistAvailabilityApi implements ArtistAvailabilityApi {
  private readonly http = inject(HttpClient);

  tourDates(slug: string, from: CalendarDate | null): Observable<TourDate[]> {
    return this.http
      .get<{
        data: TourDate[];
      }>(`/api/v1/artists/${encodeURIComponent(slug)}/tour-dates`, {
        params: from ? { from } : {},
      })
      .pipe(map((response) => response.data));
  }

  check(slug: string, date: CalendarDate): Observable<DateCheck | DateRefused> {
    return this.http
      .get<{
        data: DateCheck;
      }>(`/api/v1/artists/${encodeURIComponent(slug)}/availability`, { params: { date } })
      .pipe(
        map((response): DateCheck | DateRefused => response.data),
        catchError((error: unknown) => {
          const refused =
            error instanceof HttpErrorResponse && error.status === 422
              ? (error.error?.errors?.date?.[0] as string | undefined)
              : undefined;
          return refused ? of({ date, refused }) : throwError(() => error);
        }),
      );
  }
}
