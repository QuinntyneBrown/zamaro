import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type {
  AdminApplication,
  AdminApplicationQueue,
  AdminApplicationReference,
  AdminApplicationRow,
  ApplicationRejectionReason,
} from '../../models/admin/artist-application';

/**
 * The administrator's side of artist applications (review-artist-application, L2-048, L2-067.1):
 * the queue, one application for review, the reference checkboxes and the decision.
 */
export interface AdminArtistApplicationsApi {
  /** The Submitted applications, oldest first. */
  queue(): Observable<AdminApplicationQueue>;
  /** One application with every detail; opening it is audited. 404 for an unknown id. */
  show(applicationId: number): Observable<AdminApplication>;
  /** Ticks or unticks a reference; saved at once. 409 once the application is decided. */
  verifyReference(
    applicationId: number,
    referenceId: number,
    verified: boolean,
  ): Observable<AdminApplicationReference>;
  /** Approves: 422 until both references are verified, 409 once decided. */
  approve(applicationId: number): Observable<AdminApplication>;
  /** Rejects with a reason from the fixed list and an optional note of up to 1,000 characters. */
  reject(
    applicationId: number,
    decision: { reason: ApplicationRejectionReason; note?: string },
  ): Observable<AdminApplication>;
}

export const ADMIN_ARTIST_APPLICATIONS_API = new InjectionToken<AdminArtistApplicationsApi>(
  'AdminArtistApplicationsApi',
);

const BASE = '/api/v1/admin/artist-applications';

@Injectable()
export class HttpAdminArtistApplicationsApi implements AdminArtistApplicationsApi {
  private readonly http = inject(HttpClient);

  queue(): Observable<AdminApplicationQueue> {
    return this.http
      .get<{ data: AdminApplicationRow[]; meta: { waiting: number } }>(BASE)
      .pipe(map((response) => ({ applications: response.data, waiting: response.meta.waiting })));
  }

  show(applicationId: number): Observable<AdminApplication> {
    return this.http
      .get<{ data: AdminApplication }>(`${BASE}/${applicationId}`)
      .pipe(map((response) => response.data));
  }

  verifyReference(
    applicationId: number,
    referenceId: number,
    verified: boolean,
  ): Observable<AdminApplicationReference> {
    return this.http
      .put<{
        data: AdminApplicationReference;
      }>(`${BASE}/${applicationId}/references/${referenceId}/verification`, { verified })
      .pipe(map((response) => response.data));
  }

  approve(applicationId: number): Observable<AdminApplication> {
    return this.http
      .post<{ data: AdminApplication }>(`${BASE}/${applicationId}/approval`, {})
      .pipe(map((response) => response.data));
  }

  reject(
    applicationId: number,
    decision: { reason: ApplicationRejectionReason; note?: string },
  ): Observable<AdminApplication> {
    return this.http
      .post<{ data: AdminApplication }>(`${BASE}/${applicationId}/rejection`, decision)
      .pipe(map((response) => response.data));
  }
}
