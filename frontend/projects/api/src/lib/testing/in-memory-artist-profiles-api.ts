import { type Observable, of, throwError } from 'rxjs';
import type { ArtistProfile, CarriedSearch } from '../models/artist-profiles';
import { ArtistNotFound, type ArtistProfilesApi } from '../services/artist-profiles';

/**
 * In-memory ArtistProfilesApi for scenarios and component tests: returns the profiles it is given;
 * any other slug is missing, with no suggestions.
 */
export class InMemoryArtistProfilesApi implements ArtistProfilesApi {
  constructor(private readonly profiles: readonly ArtistProfile[] = []) {}

  get(slug: string, search: CarriedSearch = {}): Observable<ArtistProfile> {
    const profile = this.profiles.find((candidate) => candidate.slug === slug);
    return profile
      ? of(profile)
      : throwError(
          () =>
            new ArtistNotFound({
              date: search.date ?? '',
              radiusKm: search.radius ?? 120,
              items: [],
            }),
        );
  }
}
