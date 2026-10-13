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

/** The application queue and review screen (review-artist-application, L2-067.1, L2-048.1). */
export interface AdminArtistApplicationsApi {
  /** Submitted applications, oldest first. */
  queue(): Observable<AdminApplicationQueue>;
  /** One application in full, or 404; opening it is audited. */
  application(id: number): Observable<AdminApplication>;
  /** Ticks or unticks a church reference; answers it with who and when. */
  setReferenceVerification(
    applicationId: number,
    referenceId: number,
    verified: boolean,
  ): Observable<AdminApplicationReference>;
  /** Approves it: 422 on `references` until both are verified, 409 once decided. */
  approve(applicationId: number): Observable<AdminApplication>;
  /** Rejects it with a reason from the list and an optional note of up to 1,000 characters. */
  reject(
    applicationId: number,
    reason: ApplicationRejectionReason,
    note: string | null,
  ): Observable<AdminApplication>;
}

export const ADMIN_ARTIST_APPLICATIONS_API = new InjectionToken<AdminArtistApplicationsApi>(
  'AdminArtistApplicationsApi',
);

@Injectable()
export class HttpAdminArtistApplicationsApi implements AdminArtistApplicationsApi {
  private readonly http = inject(HttpClient);

  queue(): Observable<AdminApplicationQueue> {
    return this.http
      .get<{
        data: AdminApplicationRow[];
        meta: { waiting: number; lastDecidedAt: string | null };
      }>('/api/v1/admin/artist-applications')
      .pipe(
        map((response) => ({
          applications: response.data,
          waiting: response.meta.waiting,
          lastDecidedAt: response.meta.lastDecidedAt ?? null,
        })),
      );
  }

  application(id: number): Observable<AdminApplication> {
    return this.http
      .get<{ data: AdminApplication }>(`/api/v1/admin/artist-applications/${id}`)
      .pipe(map((response) => response.data));
  }

  setReferenceVerification(
    applicationId: number,
    referenceId: number,
    verified: boolean,
  ): Observable<AdminApplicationReference> {
    return this.http
      .put<{
        data: AdminApplicationReference;
      }>(
        `/api/v1/admin/artist-applications/${applicationId}/references/${referenceId}/verification`,
        { verified },
      )
      .pipe(map((response) => response.data));
  }

  approve(applicationId: number): Observable<AdminApplication> {
    return this.http
      .post<{ data: AdminApplication }>(
        `/api/v1/admin/artist-applications/${applicationId}/approval`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  reject(
    applicationId: number,
    reason: ApplicationRejectionReason,
    note: string | null,
  ): Observable<AdminApplication> {
    return this.http
      .post<{ data: AdminApplication }>(
        `/api/v1/admin/artist-applications/${applicationId}/rejection`,
        { reason, note },
      )
      .pipe(map((response) => response.data));
  }
}
