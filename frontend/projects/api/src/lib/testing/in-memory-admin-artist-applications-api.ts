import { type Observable, of, throwError } from 'rxjs';
import type {
  AdminApplication,
  AdminApplicationQueue,
  AdminApplicationReference,
  ApplicationRejectionReason,
} from '../models/admin/artist-application';
import type { AdminArtistApplicationsApi } from '../services/admin/artist-applications';

/**
 * In-memory AdminArtistApplicationsApi for scenarios and component tests: the queue is the submitted
 * applications given, and a tick is saved by `verifier` at the current time.
 */
export class InMemoryAdminArtistApplicationsApi implements AdminArtistApplicationsApi {
  constructor(
    private readonly applications: AdminApplication[] = [],
    private readonly verifier = 'Priya Nair',
  ) {}

  queue(): Observable<AdminApplicationQueue> {
    const applications = this.applications
      .filter((application) => application.status === 'submitted')
      .map(({ id, number, status, name, actType, baseCity, submittedAt }) => ({
        id,
        number,
        status,
        name,
        actType,
        baseCity,
        submittedAt,
      }));
    const decided = this.applications
      .map((application) => application.decision?.decidedAt ?? '')
      .filter(Boolean)
      .sort();
    return of({
      applications,
      waiting: applications.length,
      lastDecidedAt: decided[decided.length - 1] ?? null,
    });
  }

  application(id: number): Observable<AdminApplication> {
    const application = this.applications.find((candidate) => candidate.id === id);
    return application
      ? of(structuredClone(application))
      : throwError(() => new Error('not found'));
  }

  setReferenceVerification(
    applicationId: number,
    referenceId: number,
    verified: boolean,
  ): Observable<AdminApplicationReference> {
    const application = this.applications.find((candidate) => candidate.id === applicationId);
    const reference = application?.references.find((candidate) => candidate.id === referenceId);
    if (!application || !reference) return throwError(() => new Error('not found'));
    if (application.status !== 'submitted') return throwError(() => new Error('already decided'));
    reference.verifiedAt = verified ? new Date().toISOString() : null;
    reference.verifiedBy = verified ? { name: this.verifier } : null;
    return of({ ...reference });
  }

  approve(applicationId: number): Observable<AdminApplication> {
    const application = this.applications.find((candidate) => candidate.id === applicationId);
    if (!application) return throwError(() => new Error('not found'));
    if (application.status !== 'submitted') return throwError(() => new Error('already decided'));
    if (application.references.some((reference) => reference.verifiedAt === null)) {
      return throwError(() => new Error('references'));
    }
    application.status = 'approved';
    application.decision = {
      decidedAt: new Date().toISOString(),
      decidedBy: { name: this.verifier },
      rejectionReason: null,
      rejectionNote: null,
    };
    application.artist = {
      id: applicationId,
      slug: application.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      ticketNumber: `ACT-${String(applicationId).padStart(4, '0')}`,
      payoutReady: false,
    };
    return of(structuredClone(application));
  }

  reject(
    applicationId: number,
    reason: ApplicationRejectionReason,
    note: string | null,
  ): Observable<AdminApplication> {
    const application = this.applications.find((candidate) => candidate.id === applicationId);
    if (!application) return throwError(() => new Error('not found'));
    if (application.status !== 'submitted') return throwError(() => new Error('already decided'));
    application.status = 'rejected';
    application.decision = {
      decidedAt: new Date().toISOString(),
      decidedBy: { name: this.verifier },
      rejectionReason: reason,
      rejectionNote: note,
    };
    return of(structuredClone(application));
  }
}
