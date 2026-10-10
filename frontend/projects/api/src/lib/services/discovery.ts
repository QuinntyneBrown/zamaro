import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, map, type Observable, of, throwError } from 'rxjs';
import type {
  HeadlinerCard,
  LineupCard,
  Place,
  SearchQuery,
  SearchResult,
} from '../models/discovery';

/** Search and place lookup for Discover. Pages depend on the token, never the implementation. */
export interface DiscoveryApi {
  search(query: SearchQuery): Observable<SearchResult>;
  /** Null when no place matches. */
  lookUpPlace(text: string): Observable<Place | null>;
}

export const DISCOVERY_API = new InjectionToken<DiscoveryApi>('DiscoveryApi');

@Injectable()
export class HttpDiscoveryApi implements DiscoveryApi {
  private readonly http = inject(HttpClient);

  search(query: SearchQuery): Observable<SearchResult> {
    let params = new HttpParams({
      fromObject: {
        date: query.date,
        kind: query.kind,
        lat: query.lat,
        lng: query.lng,
        radius: query.radius,
        sort: query.sort,
      },
    });
    if (query.styles.length) params = params.set('styles', query.styles.join(','));
    if (query.under800) params = params.set('price', 'under-800');
    if (query.cursor) params = params.set('cursor', query.cursor);
    return this.http
      .get<{
        data: LineupCard[];
        headliner: HeadlinerCard | null;
        meta: { total: number; nextCursor: string | null };
      }>('/api/v1/search', { params })
      .pipe(
        map((response) => ({
          headliner: response.headliner,
          cards: response.data,
          total: response.meta.total,
          nextCursor: response.meta.nextCursor,
        })),
      );
  }

  lookUpPlace(text: string): Observable<Place | null> {
    return this.http.get<{ data: Place }>('/api/v1/places', { params: { q: text } }).pipe(
      map((response) => response.data),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(null)
          : throwError(() => error),
      ),
    );
  }
}
