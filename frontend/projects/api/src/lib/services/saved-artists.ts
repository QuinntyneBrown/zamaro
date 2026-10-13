import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { CalendarDate } from '../i18n/calendar-date';
import type { LineupCard } from '../models/discovery';

/** Where a saved artist stands after a save or removal, with the server's count. */
export interface SavedArtistState {
  artistId: number;
  saved: boolean;
  savedCount: number;
  /** The booker's first save ever: "Saved artists are private" shows once. */
  firstSave: boolean;
}

/** One saved artist on the list (accounts/view-saved-artists, L2-027). */
export interface SavedArtistCard extends Omit<LineupCard, 'distance'> {
  /** From the booker's church; null until they have one. */
  distance: LineupCard['distance'] | null;
  /** When the booker saved the artist, an ISO instant. */
  savedAt: string;
  /** On the date asked for; null when no date was given. */
  availability: 'free' | 'booked' | null;
}

/** A booker's visible saved artists, newest save first. */
export interface SavedArtistList {
  artists: SavedArtistCard[];
  total: number;
  date: CalendarDate | null;
}

/** A booker's saved artists (accounts/save-artist, L2-026); bookers only. */
export interface SavedArtistsApi {
  /** The list, each artist free or booked on `date` when given (L2-027). */
  list(date?: CalendarDate | null): Observable<SavedArtistList>;
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

  list(date?: CalendarDate | null): Observable<SavedArtistList> {
    return this.http
      .get<{ data: SavedArtistList }>('/api/v1/saved-artists', {
        params: date ? { date } : {},
      })
      .pipe(map((response) => response.data));
  }

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
