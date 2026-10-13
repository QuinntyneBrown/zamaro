import { type Observable, of, throwError } from 'rxjs';
import type {
  AdminVulnerableSectorCheck,
  AdminVulnerableSectorCheckQueue,
  DocumentLink,
} from '../models/admin/vulnerable-sector-check';
import type { AdminVulnerableSectorChecksApi } from '../services/admin/vulnerable-sector-checks';

/**
 * In-memory AdminVulnerableSectorChecksApi for scenarios and component tests: the queue is the
 * pending checks given, Verify marks one verified for 3 years by `verifier`, and every document link
 * points at `mediaOrigin`.
 */
export class InMemoryAdminVulnerableSectorChecksApi implements AdminVulnerableSectorChecksApi {
  constructor(
    private readonly checks: AdminVulnerableSectorCheck[] = [],
    private readonly verifier = 'Priya Nair',
    private readonly mediaOrigin = 'http://media.localhost',
  ) {}

  queue(): Observable<AdminVulnerableSectorCheckQueue> {
    const checks = this.checks.filter((check) => check.status === 'pending');
    return of({ checks, waiting: checks.length });
  }

  verify(checkId: number): Observable<AdminVulnerableSectorCheck> {
    const check = this.checks.find((candidate) => candidate.id === checkId);
    if (!check) return throwError(() => new Error('not found'));
    if (check.status !== 'pending') return throwError(() => new Error('already decided'));
    const [year, rest] = [Number(check.issuedOn.slice(0, 4)) + 3, check.issuedOn.slice(4)];
    Object.assign(check, {
      status: 'verified',
      expiresOn: `${year}${rest}`,
      verifiedAt: new Date().toISOString(),
      verifiedBy: { name: this.verifier },
    });
    return of({ ...check });
  }

  documentLink(checkId: number): Observable<DocumentLink> {
    return of({
      url: `${this.mediaOrigin}/documents/${checkId}?signature=in-memory`,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    });
  }
}
