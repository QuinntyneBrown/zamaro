import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { ArtistCalendar, ArtistCalendarDay } from '../models/artist-calendar';

/** The signed-in artist's own calendar (L2-056). Pages depend on the token, never the implementation. */
export interface ArtistCalendarApi {
  /** One month (`YYYY-MM`) of the calendar, or the current month without one. */
  month(month: string | null): Observable<ArtistCalendar>;
}

export const ARTIST_CALENDAR_API = new InjectionToken<ArtistCalendarApi>('ArtistCalendarApi');

interface CalendarResponse {
  data: { month: string; days: ArtistCalendarDay[] };
  meta: {
    window: { from: string; to: string; until: string };
    weeklyDefault: { unavailableWeekdays: number[] };
  };
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
}
