import { type Observable, of } from 'rxjs';
import type { Place, SearchAlternatives, SearchQuery, SearchResult } from '../models/discovery';
import type { DiscoveryApi } from '../services/discovery';

/** In-memory DiscoveryApi for scenarios and component tests: returns what it is given. */
export class InMemoryDiscoveryApi implements DiscoveryApi {
  readonly searches: SearchQuery[] = [];

  constructor(
    private readonly result: SearchResult = {
      headliner: null,
      cards: [],
      total: 0,
      nextCursor: null,
    },
    private readonly places: readonly Place[] = [],
    private readonly ways: SearchAlternatives = {
      nearbyDates: [],
      widerRadius: null,
      filtersApplied: false,
    },
  ) {}

  search(query: SearchQuery): Observable<SearchResult> {
    this.searches.push(query);
    return of(this.result);
  }

  alternatives(): Observable<SearchAlternatives> {
    return of(this.ways);
  }

  lookUpPlace(text: string): Observable<Place | null> {
    const wanted = text.trim().toLowerCase();
    return of(
      this.places.find((place) =>
        [place.city, place.label].some((name) => name.toLowerCase() === wanted),
      ) ?? null,
    );
  }
}
