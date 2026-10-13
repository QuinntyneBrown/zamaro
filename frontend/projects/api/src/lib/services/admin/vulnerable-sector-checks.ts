import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type {
  AdminVulnerableSectorCheck,
  AdminVulnerableSectorCheckQueue,
  DocumentLink,
} from '../../models/admin/vulnerable-sector-check';

/**
 * The administrator's side of Vulnerable Sector Checks (verify-vulnerable-sector-check, L2-049.2,
 * L2-049.4): the queue, the decision, and a link to a document.
 */
export interface AdminVulnerableSectorChecksApi {
  /** The checks waiting for verification, oldest upload first. */
  queue(): Observable<AdminVulnerableSectorCheckQueue>;
  /** Verifies a check; 422 on `issuedOn` for one issued more than 3 years ago, 409 once decided. */
  verify(checkId: number): Observable<AdminVulnerableSectorCheck>;
  /** A signed link to the document, good for 5 minutes; opening it is audited. */
  documentLink(checkId: number): Observable<DocumentLink>;
}

export const ADMIN_VULNERABLE_SECTOR_CHECKS_API =
  new InjectionToken<AdminVulnerableSectorChecksApi>('AdminVulnerableSectorChecksApi');

@Injectable()
export class HttpAdminVulnerableSectorChecksApi implements AdminVulnerableSectorChecksApi {
  private readonly http = inject(HttpClient);

  queue(): Observable<AdminVulnerableSectorCheckQueue> {
    return this.http
      .get<{
        data: AdminVulnerableSectorCheck[];
        meta: { waiting: number };
      }>('/api/v1/admin/vulnerable-sector-checks')
      .pipe(map((response) => ({ checks: response.data, waiting: response.meta.waiting })));
  }

  verify(checkId: number): Observable<AdminVulnerableSectorCheck> {
    return this.http
      .post<{
        data: AdminVulnerableSectorCheck;
      }>(`/api/v1/admin/vulnerable-sector-checks/${checkId}/verification`, {})
      .pipe(map((response) => response.data));
  }

  documentLink(checkId: number): Observable<DocumentLink> {
    return this.http
      .get<{ data: DocumentLink }>(
        `/api/v1/admin/vulnerable-sector-checks/${checkId}/document-link`,
      )
      .pipe(map((response) => response.data));
  }
}
