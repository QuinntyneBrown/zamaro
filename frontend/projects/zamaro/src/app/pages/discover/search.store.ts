import { inject, Injectable, signal } from '@angular/core';
import { DISCOVERY_API, type SearchQuery, type SearchResult } from 'api';

export type SearchStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** The Discover search: what was asked, where, and the lineup that came back. */
@Injectable()
export class SearchStore {
  private readonly api = inject(DISCOVERY_API);

  readonly status = signal<SearchStatus>('idle');
  readonly query = signal<SearchQuery | null>(null);
  /** The town the search ran from, as the poster says it: "Burlington". */
  readonly placeName = signal('');
  readonly result = signal<SearchResult | null>(null);

  search(query: SearchQuery, placeName: string): void {
    this.query.set(query);
    this.placeName.set(placeName);
    this.status.set('loading');
    this.api.search(query).subscribe({
      next: (result) => {
        this.result.set(result);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }
}
