import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { CurrentLegalDocuments } from '../models/accounts';

/**
 * The legal documents a person consents to (privacy/record-consent). The sign-up form sends back the
 * versions it showed, so the version stored is the one the person saw (L2-080.1).
 */
export interface ConsentApi {
  currentDocuments(): Observable<CurrentLegalDocuments>;
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
}
