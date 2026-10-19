import { type Observable, of } from 'rxjs';
import { addMonths, type CalendarDate } from '../i18n/calendar-date';
import type { ArtistCalendar, ArtistCalendarDay } from '../models/artist-calendar';
import type { ArtistCalendarApi } from '../services/artist-calendar';

/** The days of a month that nothing has touched: every one Free. */
export function freeMonth(month: string): ArtistCalendarDay[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => ({
    date: `${month}-${String(index + 1).padStart(2, '0')}`,
    status: 'free',
    requestCount: 0,
    editable: true,
    church: null,
    kind: null,
    city: null,
    cause: null,
    note: null,
  }));
}

/**
 * In-memory ArtistCalendarApi for scenarios and component tests: answers the days it is given for
 * a month and calls every other month Free. The window runs 18 months from `today`.
 */
export class InMemoryArtistCalendarApi implements ArtistCalendarApi {
  constructor(
    private readonly today: CalendarDate,
    private readonly months: Readonly<Record<string, readonly ArtistCalendarDay[]>> = {},
    private readonly unavailableWeekdays: number[] = [],
  ) {}

  month(month: string | null): Observable<ArtistCalendar> {
    const until = addMonths(this.today, 18);
    const wanted = month ?? this.today.slice(0, 7);
    return of({
      month: wanted,
      days: [...(this.months[wanted] ?? freeMonth(wanted))],
      window: { from: this.today.slice(0, 7), to: until.slice(0, 7), until },
      unavailableWeekdays: [...this.unavailableWeekdays],
    });
  }
}
