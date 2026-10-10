import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DISCOVERY_API, type SearchAlternatives, type SearchQuery, type SearchResult } from 'api';
import type { Subscription } from 'rxjs';
import { LastSearch } from '../../shared/last-search';
import { DEFAULT_STATE, type SearchState, toParams, toQuery } from './search-query-codec';

export type SearchStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'limited';

/** Skeletons appear only when a search takes longer than this (L2-105.1). */
export const SKELETON_DELAY_MS = 300;
/** After this long the status line thanks the person for waiting. */
export const SLOW_SEARCH_MS = 8000;
/** The wait when a 429 carries no Retry-After. */
const DEFAULT_RETRY_SECONDS = 60;

/**
 * The Discover search. The address bar is the source of truth (L2-009): the page loads each state
 * from it, and every change navigates. A failure keeps the criteria and counts consecutive
 * failures (L2-106); a 429 counts down from Retry-After (L2-077) but never retries on its own.
 */
@Injectable()
export class SearchStore {
  private readonly api = inject(DISCOVERY_API);
  private readonly router = inject(Router);
  private readonly lastSearch = inject(LastSearch);

  /** The criteria in the address bar, complete or not. */
  readonly state = signal<SearchState>(DEFAULT_STATE);
  readonly status = signal<SearchStatus>('idle');
  /** The search that ran, when the state was complete enough to run one. */
  readonly query = signal<SearchQuery | null>(null);
  readonly result = signal<SearchResult | null>(null);
  /** True once a search has been loading for 300 ms: show skeletons, mark the region busy. */
  readonly showSkeletons = signal(false);
  readonly slow = signal(false);
  readonly consecutiveFailures = signal(0);
  readonly loadingMore = signal(false);
  /** Ways forward, loaded only when a search finds nobody (L2-011). */
  readonly alternatives = signal<SearchAlternatives | null>(null);
  /** The wait the API asked for, and the seconds still to go. */
  readonly retryAfter = signal(0);
  readonly retryIn = signal(0);

  private request?: Subscription;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private countdown?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimers());
  }

  /** The town the search ran from, as the poster says it: "Burlington". */
  placeName(): string {
    return this.state().place;
  }

  /** Takes a state from the address bar; searches when it is complete and `search` is set. */
  load(state: SearchState, search: boolean): void {
    this.state.set(state);
    const query = toQuery(state);
    if (query && search) {
      this.query.set(query);
      this.run();
    }
  }

  /**
   * Moves to a new state through the address bar. "Show the lineup" adds a history entry; a sort
   * or chip change replaces it, so Back does not step through every chip.
   */
  navigate(change: Partial<SearchState>, options: { replace: boolean }): void {
    const next = { ...this.state(), ...change };
    const params = toParams(next);
    const unchanged = JSON.stringify(toParams(this.state())) === JSON.stringify(params);
    if (unchanged && this.query()) {
      this.retry();
      return;
    }
    void this.router.navigate(['/'], { queryParams: params, replaceUrl: options.replace });
  }

  /** Try again: the same search. */
  retry(): void {
    if (this.query()) this.run();
  }

  /** Appends the next page of tickets (L2-010); resolves with how many came. */
  loadMore(): Promise<number> {
    const query = this.query();
    const result = this.result();
    if (!query || !result?.nextCursor || this.loadingMore()) return Promise.resolve(0);
    this.loadingMore.set(true);
    return new Promise((resolve) => {
      this.api.search({ ...query, cursor: result.nextCursor! }).subscribe({
        next: (page) => {
          this.result.set({
            ...result,
            cards: [...result.cards, ...page.cards],
            nextCursor: page.nextCursor,
          });
          this.loadingMore.set(false);
          resolve(page.cards.length);
        },
        error: () => {
          this.loadingMore.set(false);
          resolve(0);
        },
      });
    });
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
        this.alternatives.set(null);
        this.lastSearch.remember({
          params: toParams(this.state()),
          date: query.date,
          headlinerSlug: result.headliner?.slug ?? null,
        });
        // A separate call, so the search itself never pays for it.
        if (result.total === 0) {
          this.api.alternatives(query).subscribe((ways) => this.alternatives.set(ways));
        }
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
