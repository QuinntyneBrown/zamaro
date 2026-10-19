import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  ARTIST_CALENDAR_API,
  type ArtistCalendar,
  type ArtistCalendarDay,
  type DateRange,
  type RangeResult,
  type RangeWarning,
} from 'api';
import { type Observable, type Subscription, tap } from 'rxjs';

/** Consecutive dates the artist chose to be unavailable, with their note. */
export interface UnavailableRun {
  from: ArtistCalendarDay;
  to: ArtistCalendarDay;
}

/**
 * The artist's calendar, one month at a time (L2-056): the month on show, its days, the pager
 * window, the weekly default and the days selected for the bulk bar.
 */
@Injectable()
export class AvailabilityStore {
  private readonly api = inject(ARTIST_CALENDAR_API);
  private request?: Subscription;

  readonly status = signal<'loading' | 'loaded' | 'error'>('loading');
  readonly calendar = signal<ArtistCalendar | null>(null);
  /** The month asked for, `YYYY-MM`, or null for the current one. */
  readonly month = signal<string | null>(null);
  /** The selected dates, ascending. */
  readonly selected = signal<string[]>([]);

  readonly days = computed(() => this.calendar()?.days ?? []);
  readonly window = computed(() => this.calendar()?.window ?? null);
  readonly unavailableWeekdays = computed(() => this.calendar()?.unavailableWeekdays ?? []);

  readonly booked = computed(() => this.days().filter((day) => day.status === 'booked').length);
  readonly requested = computed(
    () => this.days().filter((day) => day.status === 'requested').length,
  );
  /** Free Saturdays left in the month. */
  readonly freeSaturdays = computed(
    () =>
      this.days().filter(
        (day) => day.status === 'free' && new Date(`${day.date}T00:00:00Z`).getUTCDay() === 6,
      ).length,
  );
  /** Nothing set at all: every day Free and no weekly default (docs/mocks/pages/availability/empty). */
  readonly untouched = computed(
    () =>
      this.calendar() !== null &&
      this.days().every((day) => day.status === 'free') &&
      this.unavailableWeekdays().length === 0,
  );

  readonly canGoBack = computed(() => {
    const calendar = this.calendar();
    return calendar !== null && calendar.month > calendar.window.from;
  });
  readonly canGoForward = computed(() => {
    const calendar = this.calendar();
    return calendar !== null && calendar.month < calendar.window.to;
  });

  /** The chosen Unavailable dates as runs of consecutive days sharing a note, for the month list. */
  readonly unavailableRuns = computed<UnavailableRun[]>(() => {
    const runs: UnavailableRun[] = [];
    for (const day of this.days()) {
      if (day.status !== 'unavailable' || day.cause !== 'chosen') continue;
      const last = runs[runs.length - 1];
      if (last && last.to.note === day.note && nextDate(last.to.date) === day.date) {
        last.to = day;
      } else {
        runs.push({ from: day, to: day });
      }
    }
    return runs;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  /** Loads a month; the selection is dropped with the month it belonged to. */
  load(month: string | null): void {
    this.request?.unsubscribe();
    this.month.set(month);
    this.selected.set([]);
    this.status.set('loading');
    this.request = this.api.month(month).subscribe({
      next: (calendar) => {
        this.calendar.set(calendar);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  /** Reads the month again after a save, keeping the page as it is until the answer lands. */
  reload(): void {
    this.request?.unsubscribe();
    this.selected.set([]);
    this.request = this.api.month(this.month()).subscribe({
      next: (calendar) => {
        this.calendar.set(calendar);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  /** Saves a range; the page reloads the month once a result, not a warning, comes back. */
  saveRange(range: DateRange): Observable<RangeResult | RangeWarning> {
    return this.api.setDates(range).pipe(
      tap((result) => {
        if (!('affectedRequests' in result)) this.reload();
      }),
    );
  }

  /** Replaces the weekly default on the calendar once the dialog saved it. */
  weeklyDefaultSaved(unavailableWeekdays: number[]): void {
    const calendar = this.calendar();
    if (calendar) this.calendar.set({ ...calendar, unavailableWeekdays });
    this.reload();
  }

  /** The selected dates as runs of consecutive days, each one range to save. */
  selectedRuns(): { from: string; to: string }[] {
    const runs: { from: string; to: string }[] = [];
    for (const date of this.selected()) {
      const last = runs[runs.length - 1];
      if (last && nextDate(last.to) === date) last.to = date;
      else runs.push({ from: date, to: date });
    }
    return runs;
  }

  /** The month `steps` months away from the one on show, clamped to the window. */
  adjacentMonth(direction: 'previous' | 'next'): string | null {
    const calendar = this.calendar();
    if (!calendar) return null;
    const [year, month] = calendar.month.split('-').map(Number);
    const target = new Date(Date.UTC(year, month - 1 + (direction === 'next' ? 1 : -1), 1));
    const key = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`;
    return key >= calendar.window.from && key <= calendar.window.to ? key : null;
  }

  select(dates: string[]): void {
    this.selected.set(dates);
  }

  clearSelection(): void {
    this.selected.set([]);
  }
}

function nextDate(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
