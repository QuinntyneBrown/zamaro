import { type Observable, of } from 'rxjs';
import type { AdminOverview } from '../models/admin/overview';
import type { AdminOverviewApi } from '../services/admin/overview';

/** In-memory AdminOverviewApi for scenarios and component tests. */
export class InMemoryAdminOverviewApi implements AdminOverviewApi {
  constructor(private readonly counts: AdminOverview = { checksWaiting: 2 }) {}

  overview(): Observable<AdminOverview> {
    return of(this.counts);
  }
}
