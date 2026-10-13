import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { CurrentLegalDocuments, CurrentUser } from '../models/accounts';

/**
 * The legal documents a person consents to (privacy/record-consent). The sign-up form and the
 * accept-terms page send back the versions they showed, so the version stored is the one the person
 * saw (L2-080.1, L2-080.3).
 */
export interface ConsentApi {
  currentDocuments(): Observable<CurrentLegalDocuments>;
  /** Accepts the current terms; the answer is the person, no longer stopped. 409 when stale. */
  acceptTerms(termsVersion: string): Observable<CurrentUser>;
  /** The latest marketing choice: emails about new artists near the church (L2-080.4). */
  marketingChoice(): Observable<boolean>;
  /** Appends a new marketing record; the earlier ones stay. */
  saveMarketingChoice(granted: boolean): Observable<boolean>;
}

export const CONSENT_API = new InjectionToken<ConsentApi>('ConsentApi');

@Injectable()
export class HttpConsentApi implements ConsentApi {
  private readonly http = inject(HttpClient);

  currentDocuments(): Observable<CurrentLegalDocuments> {
    return this.http
      .get<{ data: CurrentLegalDocuments }>('/api/v1/legal-documents/current')
      .pipe(map((response) => response.data));
  }

  acceptTerms(termsVersion: string): Observable<CurrentUser> {
    return this.http
      .post<{ data: CurrentUser }>('/api/v1/account/consents/terms', { termsVersion })
      .pipe(map((response) => response.data));
  }

  marketingChoice(): Observable<boolean> {
    return this.http
      .get<{ data: { granted: boolean } }>('/api/v1/account/consents/marketing')
      .pipe(map((response) => response.data.granted));
  }

  saveMarketingChoice(granted: boolean): Observable<boolean> {
    return this.http
      .post<{ data: { granted: boolean } }>('/api/v1/account/consents/marketing', { granted })
      .pipe(map((response) => response.data.granted));
  }
}
