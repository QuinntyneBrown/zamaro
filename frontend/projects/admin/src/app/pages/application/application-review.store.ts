import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ADMIN_ARTIST_APPLICATIONS_API,
  type AdminApplication,
  type AdminApplicationReference,
} from 'api';

export type ReviewStatus = 'loading' | 'loaded' | 'error';

/**
 * One application under review (review-artist-application): the application, the reference ticks on
 * their way, and `canApprove`, true once both references are verified (L2-048.1).
 */
@Injectable()
export class ApplicationReviewStore {
  private readonly api = inject(ADMIN_ARTIST_APPLICATIONS_API);
  private readonly destroyRef = inject(DestroyRef);

  readonly status = signal<ReviewStatus>('loading');
  readonly application = signal<AdminApplication | null>(null);
  /** The reference whose tick is on its way, if any. */
  readonly saving = signal<number | null>(null);
  /** The last tick that failed, for the toast. */
  readonly tickFailed = signal<AdminApplicationReference | null>(null);
  /** Approve is on its way. */
  readonly approving = signal(false);
  /** The last approval that failed, with what the API said, for the toast. */
  readonly approveFailed = signal<{ detail: string | null } | null>(null);

  readonly verifiedCount = computed(
    () =>
      this.application()?.references.filter((reference) => reference.verifiedAt !== null).length ??
      0,
  );
  readonly canApprove = computed(() => {
    const application = this.application();
    return (
      !!application &&
      application.status === 'submitted' &&
      application.references.length > 0 &&
      this.verifiedCount() === application.references.length
    );
  });

  load(id: number): void {
    this.status.set('loading');
    this.api
      .application(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (application) => {
          this.application.set(application);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }

  /** Ticks or unticks a reference; the row shows the API's answer, or returns to how it was. */
  setReferenceVerification(reference: AdminApplicationReference, verified: boolean): void {
    const application = this.application();
    if (!application || this.saving() !== null) return;
    this.saving.set(reference.id);
    this.tickFailed.set(null);
    this.api
      .setReferenceVerification(application.id, reference.id, verified)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(null);
          this.application.update(
            (current) =>
              current && {
                ...current,
                references: current.references.map((row) => (row.id === saved.id ? saved : row)),
              },
          );
        },
        error: () => {
          this.saving.set(null);
          this.tickFailed.set(reference);
          // The box returns to the saved state.
          this.application.update((current) => current && { ...current });
        },
      });
  }

  /** Approve: the API grants the role and creates the hidden artist (L2-048.1). */
  approve(): void {
    const application = this.application();
    if (!application || this.approving() || !this.canApprove()) return;
    this.approving.set(true);
    this.approveFailed.set(null);
    this.api
      .approve(application.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (approved) => {
          this.approving.set(false);
          this.application.set(approved);
        },
        error: (failure: { error?: { detail?: string; errors?: Record<string, string[]> } }) => {
          this.approving.set(false);
          this.approveFailed.set({
            detail: failure.error?.errors?.['references']?.[0] ?? failure.error?.detail ?? null,
          });
        },
      });
  }

  /** The reject dialog closed with the decided application. */
  decided(application: AdminApplication): void {
    this.application.set(application);
  }
}
