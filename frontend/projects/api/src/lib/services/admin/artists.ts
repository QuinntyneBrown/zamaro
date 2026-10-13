import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { AdminArtistDetail, AdminArtistList, AdminArtistRow } from '../../models/admin/artist';

/** The read-only Artists section (suspend-and-reinstate-artists, L2-067; M3 D18). */
export interface AdminArtistsApi {
  /** Every approved and suspended artist A to Z; `query` narrows to a word start in the name, city or email. */
  list(query?: string): Observable<AdminArtistList>;
  /** One artist, or 404. */
  artist(id: number): Observable<AdminArtistDetail>;
}

export const ADMIN_ARTISTS_API = new InjectionToken<AdminArtistsApi>('AdminArtistsApi');

@Injectable()
export class HttpAdminArtistsApi implements AdminArtistsApi {
  private readonly http = inject(HttpClient);

  list(query = ''): Observable<AdminArtistList> {
    return this.http
      .get<{
        data: AdminArtistRow[];
        meta: { total: number; approved: number; suspended: number };
      }>('/api/v1/admin/artists', { params: query ? { q: query } : {} })
      .pipe(map((response) => ({ artists: response.data, ...response.meta })));
  }

  artist(id: number): Observable<AdminArtistDetail> {
    return this.http
      .get<{ data: AdminArtistDetail }>(`/api/v1/admin/artists/${id}`)
      .pipe(map((response) => response.data));
  }
}
