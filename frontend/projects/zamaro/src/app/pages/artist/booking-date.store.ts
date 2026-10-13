import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  ARTIST_AVAILABILITY_API,
  type CalendarDate,
  type DateCheck,
  type DateRefused,
  type TourDate,
} from 'api';
import type { Subscription } from 'rxjs';

/** What the stub knows about its date: nothing chosen, being checked, free, booked or refused. */
export type DateStatus = 'none' | 'checking' | 'free' | 'booked' | 'refused';

/**
 * The profile's "On tour" list and the booking stub's date (L2-017, L2-019). The date starts as the
 * one carried from Discover. A date the list already shows needs no request; any other date is
 * checked with the API.
 */
@Injectable()
export class BookingDateStore {
  private readonly api = inject(ARTIST_AVAILABILITY_API);

  readonly tourDates = signal<TourDate[]>([]);
  /** True until the list arrives (or fails, leaving it empty). */
  readonly tourDatesLoading = signal(true);
  readonly selectedDate = signal<CalendarDate | null>(null);

  private readonly checked = signal<DateCheck | DateRefused | null>(null);
  private slug = '';
  private listRequest?: Subscription;
  private checkRequest?: Subscription;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.listRequest?.unsubscribe();
      this.checkRequest?.unsubscribe();
    });
  }

  readonly status = computed<DateStatus>(() => {
    const date = this.selectedDate();
    if (!date) return 'none';
    const row = this.tourDates().find((candidate) => candidate.date === date);
    if (row) return row.status;
    const checked = this.checked();
    if (checked?.date !== date) return 'checking';
    if ('refused' in checked) return 'refused';
    return checked.free ? 'free' : 'booked';
  });

  /** Why the API will not take the date ("Pick a date at least 3 days away."), when it refused it. */
  readonly refusal = computed(() => {
    const checked = this.checked();
    return checked && 'refused' in checked && checked.date === this.selectedDate()
      ? checked.refused
      : null;
  });

  /** Loads the artist's next dates from `from` (the carried search date) and selects it. */
  load(slug: string, from: CalendarDate | null): void {
    this.slug = slug;
    this.selectedDate.set(from);
    this.checked.set(null);
    this.tourDatesLoading.set(true);
    this.listRequest?.unsubscribe();
    this.listRequest = this.api.tourDates(slug, from).subscribe({
      next: (dates) => this.settle(dates),
      error: () => this.settle([]),
    });
  }

  /** A date picked or typed in the stub; an incomplete date clears the choice. */
  select(date: string | null): void {
    this.selectedDate.set(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null);
    this.checkIfUnlisted();
  }

  private settle(dates: TourDate[]): void {
    this.tourDates.set(dates);
    this.tourDatesLoading.set(false);
    this.checkIfUnlisted();
  }

  private checkIfUnlisted(): void {
    const date = this.selectedDate();
    if (!date || this.tourDatesLoading() || this.status() !== 'checking') return;
    this.checkRequest?.unsubscribe();
    this.checkRequest = this.api.check(this.slug, date).subscribe({
      next: (checked) => this.checked.set(checked),
      error: () => undefined,
    });
  }
}
