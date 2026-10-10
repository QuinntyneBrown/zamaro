import { HttpErrorResponse } from '@angular/common/http';
import { type Observable, of, throwError } from 'rxjs';
import type { ArtistProfile } from '../models/artist-profiles';
import type { ArtistProfilesApi } from '../services/artist-profiles';

/** In-memory ArtistProfilesApi for scenarios and component tests: returns the profiles it is given. */
export class InMemoryArtistProfilesApi implements ArtistProfilesApi {
  constructor(private readonly profiles: readonly ArtistProfile[] = []) {}

  get(slug: string): Observable<ArtistProfile> {
    const profile = this.profiles.find((candidate) => candidate.slug === slug);
    return profile
      ? of(profile)
      : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }
}
