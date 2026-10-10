import { isPlatformServer } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import {
  inject,
  Injectable,
  InjectionToken,
  makeStateKey,
  PLATFORM_ID,
  TransferState,
} from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import type { ArtistProfile, CarriedSearch, SimilarArtists } from '../models/artist-profiles';

/** No viewable artist has the address (L2-021): it never existed, or the artist is hidden. */
export class ArtistNotFound extends Error {
  constructor(readonly similarArtists: SimilarArtists) {
    super('This artist isn’t on Zamaro');
  }
}

/** Public artist profiles. Pages depend on the token, never the implementation. */
export interface ArtistProfilesApi {
  /**
   * The profile; a renamed artist's comes back under the current `slug`. Errors with ArtistNotFound
   * when no viewable artist has the address, suggesting artists from the carried search.
   */
  get(slug: string, search?: CarriedSearch): Observable<ArtistProfile>;
}

export const ARTIST_PROFILES_API = new InjectionToken<ArtistProfilesApi>('ArtistProfilesApi');

/**
 * Fetched while rendering on the server, the profile reaches the browser in the transfer cache. The
 * HTTP transfer cache keeps successes only, so a missing artist's suggestions travel in the transfer
 * state instead, and the browser shows the server's page without asking again.
 */
@Injectable()
export class HttpArtistProfilesApi implements ArtistProfilesApi {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly onServer = isPlatformServer(inject(PLATFORM_ID));

  get(slug: string, search: CarriedSearch = {}): Observable<ArtistProfile> {
    const url = `/api/v1/artists/${encodeURIComponent(slug)}`;
    let params = new HttpParams();
    for (const [name, value] of Object.entries(search)) {
      if (value !== undefined && value !== '') params = params.set(name, value);
    }
    const missingKey = makeStateKey<SimilarArtists>(`artist-not-found:${url}?${params}`);
    const missing = this.transferState.get(missingKey, null);
    if (missing && !this.onServer) {
      this.transferState.remove(missingKey);
      return throwError(() => new ArtistNotFound(missing));
    }

    return this.http.get<{ data: ArtistProfile }>(url, { params }).pipe(
      map((response) => response.data),
      catchError((error: unknown) => {
        const similar = (error as HttpErrorResponse).error?.similarArtists as
          SimilarArtists | undefined;
        if (!(error instanceof HttpErrorResponse) || error.status !== 404 || !similar) {
          return throwError(() => error);
        }
        if (this.onServer) this.transferState.set(missingKey, similar);
        return throwError(() => new ArtistNotFound(similar));
      }),
    );
  }
}
