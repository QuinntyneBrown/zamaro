import { type Observable, of } from 'rxjs';
import type { CalendarDate } from '../i18n/calendar-date';
import type { DateCheck, DateRefused, TourDate } from '../models/artist-availability';
import type { ArtistAvailabilityApi } from '../services/artist-availability';

/**
 * In-memory ArtistAvailabilityApi for scenarios and component tests: lists the dates it is given
 * and calls any other date free.
 */
export class InMemoryArtistAvailabilityApi implements ArtistAvailabilityApi {
  constructor(private readonly dates: Readonly<Record<string, readonly TourDate[]>> = {}) {}

  tourDates(slug: string, from: CalendarDate | null): Observable<TourDate[]> {
    return of((this.dates[slug] ?? []).filter((row) => !from || row.date >= from).slice(0, 6));
  }

  check(slug: string, date: CalendarDate): Observable<DateCheck | DateRefused> {
    const row = (this.dates[slug] ?? []).find((candidate) => candidate.date === date);
    return of({ date, free: row?.status !== 'booked', freeCancellationUntil: null });
  }
}
