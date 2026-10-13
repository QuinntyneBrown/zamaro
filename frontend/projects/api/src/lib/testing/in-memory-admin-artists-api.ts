import { type Observable, of, throwError } from 'rxjs';
import type { AdminArtistDetail, AdminArtistList, AdminArtistRow } from '../models/admin/artist';
import type { AdminArtistsApi } from '../services/admin/artists';

/** In-memory AdminArtistsApi for scenarios and component tests: a word-start search over the details given. */
export class InMemoryAdminArtistsApi implements AdminArtistsApi {
  constructor(private readonly artists: AdminArtistDetail[] = []) {}

  list(query = ''): Observable<AdminArtistList> {
    const term = query.trim().toLowerCase();
    const starts = (text: string) =>
      text
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(term));
    const rows: AdminArtistRow[] = this.artists
      .filter(
        (artist) => !term || starts(artist.name) || starts(artist.baseCity) || starts(artist.email),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ id, name, slug, actType, baseCity, rating, status }) => ({
        id,
        name,
        slug,
        actType,
        baseCity,
        rating,
        status,
      }));
    return of({
      artists: rows,
      total: this.artists.length,
      approved: this.artists.filter((artist) => artist.status === 'approved').length,
      suspended: this.artists.filter((artist) => artist.status === 'suspended').length,
    });
  }

  artist(id: number): Observable<AdminArtistDetail> {
    const artist = this.artists.find((candidate) => candidate.id === id);
    return artist ? of(artist) : throwError(() => new Error('not found'));
  }
}
