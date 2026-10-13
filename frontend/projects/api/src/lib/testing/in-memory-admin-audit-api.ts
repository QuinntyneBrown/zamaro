import { type Observable, of } from 'rxjs';
import type { AuditEntry, AuditEntryPage, AuditFilters } from '../models/admin/audit-entry';
import type { AdminAuditApi } from '../services/admin/audit';

/** In-memory AdminAuditApi for scenarios and component tests: filters by action and outcome, no paging. */
export class InMemoryAdminAuditApi implements AdminAuditApi {
  constructor(private readonly entries: AuditEntry[] = []) {}

  list(filters: AuditFilters): Observable<AuditEntryPage> {
    const entries = this.entries.filter(
      (entry) =>
        (!filters.action || entry.action === filters.action) &&
        (!filters.outcome || entry.outcome === filters.outcome) &&
        (!filters.actor || entry.actor?.email.toLowerCase() === filters.actor.toLowerCase()),
    );
    return of({ entries, perPage: 50, nextCursor: null });
  }
}
