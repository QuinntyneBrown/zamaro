import { type Observable, of, throwError } from 'rxjs';
import type {
  AdminApplication,
  AdminApplicationQueue,
  AdminApplicationReference,
  ApplicationRejectionReason,
} from '../models/admin/artist-application';
import type { AdminArtistApplicationsApi } from '../services/admin/artist-applications';

/**
 * In-memory AdminArtistApplicationsApi for scenarios and component tests: the queue is the Submitted
 * applications given, references tick at once, approval needs both verified, and either decision
 * is recorded as made by `decider`.
 */
export class InMemoryAdminArtistApplicationsApi implements AdminArtistApplicationsApi {
  constructor(
    private readonly applications: AdminApplication[] = [],
    private readonly decider = 'Priya Nair',
  ) {}

  queue(): Observable<AdminApplicationQueue> {
    const applications = this.applications
      .filter((application) => application.status === 'submitted')
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    return of({ applications, waiting: applications.length });
  }

  show(applicationId: number): Observable<AdminApplication> {
    const application = this.find(applicationId);
    return application ? of({ ...application }) : throwError(() => new Error('not found'));
  }

  verifyReference(
    applicationId: number,
    referenceId: number,
    verified: boolean,
  ): Observable<AdminApplicationReference> {
    const application = this.find(applicationId);
    const reference = application?.references.find((candidate) => candidate.id === referenceId);
    if (!application || !reference) return throwError(() => new Error('not found'));
    if (application.status !== 'submitted') return throwError(() => new Error('already decided'));
    Object.assign(reference, {
      verifiedAt: verified ? new Date().toISOString() : null,
      verifiedBy: verified ? { name: this.decider } : null,
    });
    return of({ ...reference });
  }

  approve(applicationId: number): Observable<AdminApplication> {
    const application = this.find(applicationId);
    if (!application) return throwError(() => new Error('not found'));
    if (application.status !== 'submitted') return throwError(() => new Error('already decided'));
    if (application.references.some((reference) => reference.verifiedAt === null)) {
      return throwError(() => new Error('Verify both references before you approve.'));
    }
    return of(this.decide(application, 'approved', null));
  }

  reject(
    applicationId: number,
    decision: { reason: ApplicationRejectionReason; note?: string },
  ): Observable<AdminApplication> {
    const application = this.find(applicationId);
    if (!application) return throwError(() => new Error('not found'));
    if (application.status !== 'submitted') return throwError(() => new Error('already decided'));
    return of(
      this.decide(application, 'rejected', {
        reason: decision.reason,
        note: decision.note?.trim() ? decision.note.trim() : null,
      }),
    );
  }

  private find(applicationId: number): AdminApplication | undefined {
    return this.applications.find((candidate) => candidate.id === applicationId);
  }

  private decide(
    application: AdminApplication,
    status: 'approved' | 'rejected',
    rejection: AdminApplication['rejection'],
  ): AdminApplication {
    Object.assign(application, {
      status,
      decidedAt: new Date().toISOString(),
      decidedBy: { name: this.decider },
      rejection,
    });
    return { ...application };
  }
}
