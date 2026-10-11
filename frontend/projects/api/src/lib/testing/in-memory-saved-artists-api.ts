import { type Observable, of } from 'rxjs';
import type { SavedArtistsApi, SavedArtistState } from '../services/saved-artists';

/** In-memory SavedArtistsApi for scenarios and component tests. */
export class InMemorySavedArtistsApi implements SavedArtistsApi {
  private readonly saved: Set<number>;
  private first = true;

  constructor(ids: number[] = []) {
    this.saved = new Set(ids);
  }

  ids(): Observable<{ artistIds: number[]; count: number }> {
    return of({ artistIds: [...this.saved], count: this.saved.size });
  }

  save(artistId: number): Observable<SavedArtistState> {
    this.saved.add(artistId);
    const firstSave = this.first;
    this.first = false;
    return of({ artistId, saved: true, savedCount: this.saved.size, firstSave });
  }

  unsave(artistId: number): Observable<SavedArtistState> {
    this.saved.delete(artistId);
    return of({ artistId, saved: false, savedCount: this.saved.size, firstSave: false });
  }
}
