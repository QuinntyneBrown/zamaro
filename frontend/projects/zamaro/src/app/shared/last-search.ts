import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import type { Params } from '@angular/router';
import type { CalendarDate, SearchAlternatives, SearchResult } from 'api';

export interface RememberedSearch {
  /** Discover's query parameters, to return to the same results (L2-009.2, L2-107). */
  params: Params;
  date: string;
  /** The artist the search featured as headliner (L2-006), if any. */
  headlinerSlug: string | null;
  /** The lineup as last shown, with every page loaded, so Back can show it again at once. */
  result: SearchResult;
  alternatives: SearchAlternatives | null;
}

const DATE_KEY = 'zamaro.lastSearchDate';

/**
 * The last search that showed a lineup, kept while the app runs so a profile can lead back to it. Its
 * date is also kept in this browser's `localStorage`, for Saved artists (D14).
 */
@Injectable({ providedIn: 'root' })
export class LastSearch {
  readonly search = signal<RememberedSearch | null>(null);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  remember(search: RememberedSearch): void {
    this.search.set(search);
    if (!this.browser) return;
    try {
      localStorage.setItem(DATE_KEY, search.date);
    } catch {
      // Blocked storage: Saved artists asks for a date instead.
    }
  }

  /** The most recent search date in this browser, if any. */
  lastDate(): CalendarDate | null {
    if (!this.browser) return null;
    try {
      const date = localStorage.getItem(DATE_KEY);
      return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? (date as CalendarDate) : null;
    } catch {
      return null;
    }
  }

  /** Keeps the remembered lineup in step as pages or ways forward arrive. */
  update(change: Partial<Pick<RememberedSearch, 'result' | 'alternatives'>>): void {
    this.search.update((search) => (search ? { ...search, ...change } : search));
  }
}
