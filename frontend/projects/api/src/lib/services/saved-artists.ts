import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';

/** Where a saved artist stands after a save or removal, with the server's count. */
export interface SavedArtistState {
  artistId: number;
  saved: boolean;
  savedCount: number;
  /** The booker's first save ever: "Saved artists are private" shows once. */
  firstSave: boolean;
}

/** A booker's saved artists (accounts/save-artist, L2-026); bookers only. */
export interface SavedArtistsApi {
  /** The saved artists' ids and their count. */
  ids(): Observable<{ artistIds: number[]; count: number }>;
  /** Saving twice is the same as once; 422 `saved-artist-limit` at 200. */
  save(artistId: number): Observable<SavedArtistState>;
  unsave(artistId: number): Observable<SavedArtistState>;
}

export const SAVED_ARTISTS_API = new InjectionToken<SavedArtistsApi>('SavedArtistsApi');

@Injectable()
export class HttpSavedArtistsApi implements SavedArtistsApi {
  private readonly http = inject(HttpClient);

  ids(): Observable<{ artistIds: number[]; count: number }> {
    return this.http
      .get<{ data: { artistIds: number[]; count: number } }>('/api/v1/saved-artists/ids')
      .pipe(map((response) => response.data));
  }

  save(artistId: number): Observable<SavedArtistState> {
    return this.http
      .put<{ data: SavedArtistState }>(`/api/v1/saved-artists/${artistId}`, {})
      .pipe(map((response) => response.data));
  }

  unsave(artistId: number): Observable<SavedArtistState> {
    return this.http
      .delete<{ data: SavedArtistState }>(`/api/v1/saved-artists/${artistId}`)
      .pipe(map((response) => response.data));
  }
}
