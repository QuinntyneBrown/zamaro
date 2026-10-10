import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DISCOVERY_API, type SearchQuery, type SearchResult } from 'api';
import type { Subscription } from 'rxjs';

export type SearchStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'limited';

/** Skeletons appear only when a search takes longer than this (L2-105.1). */
export const SKELETON_DELAY_MS = 300;
/** After this long the status line thanks the person for waiting. */
export const SLOW_SEARCH_MS = 8000;
/** The wait when a 429 carries no Retry-After. */
const DEFAULT_RETRY_SECONDS = 60;

/**
 * The Discover search: what was asked, where, and how it went. A failure keeps the criteria and
 * counts consecutive failures (L2-106); a 429 counts down from Retry-After (L2-077) but never
 * retries on its own.
 */
@Injectable()
export class SearchStore {
  private readonly api = inject(DISCOVERY_API);

  readonly status = signal<SearchStatus>('idle');
  readonly query = signal<SearchQuery | null>(null);
  /** The town the search ran from, as the poster says it: "Burlington". */
  readonly placeName = signal('');
  readonly result = signal<SearchResult | null>(null);
  /** True once a search has been loading for 300 ms: show skeletons, mark the region busy. */
  readonly showSkeletons = signal(false);
  readonly slow = signal(false);
  readonly consecutiveFailures = signal(0);
  /** The wait the API asked for, and the seconds still to go. */
  readonly retryAfter = signal(0);
  readonly retryIn = signal(0);

  private request?: Subscription;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private countdown?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimers());
  }

  search(query: SearchQuery, placeName: string): void {
    this.query.set(query);
    this.placeName.set(placeName);
    this.run();
  }

  /** Try again: the same search. */
  retry(): void {
    if (this.query()) this.run();
  }

  private run(): void {
    const query = this.query()!;
    this.request?.unsubscribe();
    this.stopTimers();
    this.status.set('loading');
    this.timers = [
      setTimeout(() => this.showSkeletons.set(true), SKELETON_DELAY_MS),
      setTimeout(() => this.slow.set(true), SLOW_SEARCH_MS),
    ];
    this.request = this.api.search(query).subscribe({
      next: (result) => {
        this.settle('loaded');
        this.result.set(result);
        this.consecutiveFailures.set(0);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 429) {
          this.settle('limited');
          this.startCountdown(Number(error.headers.get('Retry-After')) || DEFAULT_RETRY_SECONDS);
        } else {
          this.settle('error');
          this.consecutiveFailures.update((count) => count + 1);
        }
      },
    });
  }

  private settle(status: SearchStatus): void {
    this.stopTimers();
    this.showSkeletons.set(false);
    this.slow.set(false);
    this.status.set(status);
  }

  private startCountdown(seconds: number): void {
    this.retryAfter.set(seconds);
    this.retryIn.set(seconds);
    this.countdown = setInterval(() => {
      this.retryIn.update((left) => Math.max(0, left - 1));
      if (this.retryIn() === 0) clearInterval(this.countdown);
    }, 1000);
  }

  private stopTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    clearInterval(this.countdown);
  }
}
