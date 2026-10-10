import { type Observable, of } from 'rxjs';
import type { CurrentLegalDocuments } from '../models/accounts';
import type { ConsentApi } from '../services/consent';

/** The terms and privacy policy in force on Fri 9 Oct 2026 (the M2 seed). */
export const CURRENT_LEGAL_DOCUMENTS: CurrentLegalDocuments = {
  terms: {
    version: '2026-10',
    effectiveFrom: '2026-10-08',
    url: 'https://zamaro.ca/legal/terms',
    summaryOfChanges: [],
  },
  privacyPolicy: {
    version: '2026-10',
    effectiveFrom: '2026-10-08',
    url: 'https://zamaro.ca/legal/privacy',
    summaryOfChanges: [],
  },
};

/** In-memory ConsentApi for scenarios and component tests. */
export class InMemoryConsentApi implements ConsentApi {
  constructor(private readonly documents: CurrentLegalDocuments = CURRENT_LEGAL_DOCUMENTS) {}

  currentDocuments(): Observable<CurrentLegalDocuments> {
    return of(this.documents);
  }
}
