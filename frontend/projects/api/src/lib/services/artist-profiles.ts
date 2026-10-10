import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { ArtistProfile } from '../models/artist-profiles';

/** Public artist profiles. Pages depend on the token, never the implementation. */
export interface ArtistProfilesApi {
  /** Errors with a 404 when no visible artist has the address. */
  get(slug: string): Observable<ArtistProfile>;
}

export const ARTIST_PROFILES_API = new InjectionToken<ArtistProfilesApi>('ArtistProfilesApi');

/** Fetched while rendering on the server, the profile reaches the browser in the transfer cache. */
@Injectable()
export class HttpArtistProfilesApi implements ArtistProfilesApi {
  private readonly http = inject(HttpClient);

  get(slug: string): Observable<ArtistProfile> {
    return this.http
      .get<{ data: ArtistProfile }>(`/api/v1/artists/${encodeURIComponent(slug)}`)
      .pipe(map((response) => response.data));
  }
}
