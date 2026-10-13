import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { AdminOverview } from '../../models/admin/overview';

/**
 * The admin overview (administration/secure-admin-access). Only an administrator who signed in with
 * a code gets it; everyone else gets 404. Calling it counts as activity (L2-066.3).
 */
export interface AdminOverviewApi {
  overview(): Observable<AdminOverview>;
}

export const ADMIN_OVERVIEW_API = new InjectionToken<AdminOverviewApi>('AdminOverviewApi');

@Injectable()
export class HttpAdminOverviewApi implements AdminOverviewApi {
  private readonly http = inject(HttpClient);

  overview(): Observable<AdminOverview> {
    return this.http
      .get<{ data: AdminOverview }>('/api/v1/admin/overview')
      .pipe(map((response) => response.data));
  }
}
