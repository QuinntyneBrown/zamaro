import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { AuditEntry, AuditEntryPage, AuditFilters } from '../../models/admin/audit-entry';

/** The read-only audit log (administration/record-audit-log, L2-069); administrators only. */
export interface AdminAuditApi {
  /** The entries matching `filters`, newest first, 50 at a time; `cursor` continues from a page's `nextCursor`. */
  list(filters: AuditFilters, cursor?: string | null): Observable<AuditEntryPage>;
}

export const ADMIN_AUDIT_API = new InjectionToken<AdminAuditApi>('AdminAuditApi');

@Injectable()
export class HttpAdminAuditApi implements AdminAuditApi {
  private readonly http = inject(HttpClient);

  list(filters: AuditFilters, cursor: string | null = null): Observable<AuditEntryPage> {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries({ ...filters, cursor })) {
      if (value) params[key] = value;
    }
    return this.http
      .get<{
        data: AuditEntry[];
        meta: { perPage: number; nextCursor: string | null };
      }>('/api/v1/admin/audit-entries', { params })
      .pipe(
        map((response) => ({
          entries: response.data,
          perPage: response.meta.perPage,
          nextCursor: response.meta.nextCursor,
        })),
      );
  }
}
