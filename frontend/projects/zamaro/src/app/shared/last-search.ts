import { Injectable, signal } from '@angular/core';
import type { Params } from '@angular/router';

export interface RememberedSearch {
  /** Discover's query parameters, to return to the same results (L2-009.2, L2-107). */
  params: Params;
  date: string;
  /** The artist the search featured as headliner (L2-006), if any. */
  headlinerSlug: string | null;
}

/** The last search that showed a lineup, kept while the app runs so a profile can lead back to it. */
@Injectable({ providedIn: 'root' })
export class LastSearch {
  readonly search = signal<RememberedSearch | null>(null);

  remember(search: RememberedSearch): void {
    this.search.set(search);
  }
}
