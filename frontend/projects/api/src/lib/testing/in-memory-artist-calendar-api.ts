import { type Observable, of } from 'rxjs';
import { addMonths, type CalendarDate } from '../i18n/calendar-date';
import type {
  ArtistCalendar,
  ArtistCalendarDay,
  CalendarFeed,
  DateRange,
  RangeResult,
  RangeWarning,
} from '../models/artist-calendar';
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

  setDates(range: DateRange): Observable<RangeResult | RangeWarning> {
    return of({ changedDates: [range.from, range.to], skippedDates: [], declinedCount: 0 });
  }

  setWeekly(unavailableWeekdays: number[]): Observable<number[]> {
    return of([...unavailableWeekdays].sort((a, b) => a - b));
  }

  private calendarFeed: CalendarFeed | null = null;

  feed(): Observable<CalendarFeed | null> {
    return of(this.calendarFeed);
  }

  enableFeed(): Observable<CalendarFeed> {
    this.calendarFeed ??= {
      url: 'http://localhost:8000/api/v1/calendar-feeds/in-memory-token.ics',
      enabledAt: `${this.today}T14:00:00.000Z`,
      regeneratedAt: null,
    };
    return of(this.calendarFeed);
  }

  regenerateFeed(): Observable<CalendarFeed> {
    this.calendarFeed = {
      url: 'http://localhost:8000/api/v1/calendar-feeds/in-memory-token-2.ics',
      enabledAt: this.calendarFeed?.enabledAt ?? `${this.today}T14:00:00.000Z`,
      regeneratedAt: `${this.today}T14:00:00.000Z`,
    };
    return of(this.calendarFeed);
  }
}
