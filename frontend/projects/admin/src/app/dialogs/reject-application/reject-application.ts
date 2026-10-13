import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ADMIN_ARTIST_APPLICATIONS_API,
  type AdminApplication,
  APPLICATION_REJECTION_REASONS,
  type ApplicationRejectionReason,
  type CalendarDate,
  FormatService,
} from 'api';
import {
  Alert,
  Button,
  Dialog,
  ErrorSummary,
  type ErrorSummaryItem,
  type FieldOption,
  FormField,
  Icon,
} from 'components';

export interface RejectApplicationData {
  application: AdminApplication;
  /** "Tobi" for a solo act, the whole name for a group. */
  firstName: string;
}

const TITLE_ID = 'reject-title';
const DESCRIPTION_ID = 'reject-desc';
export const NOTE_MAX = 1000;

/**
 * Opens "Reject {name}’s application?" (docs/mocks/dialogs/reject-application) over the review
 * screen: it traps focus, closes on Escape unless the rejection is out, and returns focus to Reject…
 * It resolves with the rejected application, or nothing when cancelled.
 */
export function openRejectApplicationDialog(
  injector: Injector,
  data: RejectApplicationData,
): DialogRef<AdminApplication, RejectApplication> {
  return injector
    .get(CdkDialog)
    .open<AdminApplication, RejectApplicationData, RejectApplication>(RejectApplication, {
      data,
      ariaLabelledBy: TITLE_ID,
      ariaDescribedBy: DESCRIPTION_ID,
      ariaModal: true,
      autoFocus: false,
      restoreFocus: true,
      backdropClass: 'zm-backdrop',
      maxWidth: '100vw',
    });
}

type Status = 'idle' | 'invalid' | 'busy' | 'failed';

/**
 * L2-048.2: a reason from the fixed list is required, the note of up to 1,000 characters is optional,
 * and both reach the applicant. A failed save keeps the choices and offers Try again (L2-108.3).
 */
@Component({
  selector: 'zm-reject-application-dialog',
  imports: [
    Alert,
    Button,
    Dialog,
    ErrorSummary,
    FormField,
    Icon,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './reject-application.html',
  styleUrl: './reject-application.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectApplication {
  protected readonly dialogRef = inject<DialogRef<AdminApplication>>(DialogRef);
  protected readonly data = inject<RejectApplicationData>(DIALOG_DATA);
  private readonly api = inject(ADMIN_ARTIST_APPLICATIONS_API);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly injector = inject(Injector);

  protected readonly titleId = TITLE_ID;
  protected readonly descriptionId = DESCRIPTION_ID;
  protected readonly noteMax = NOTE_MAX;
  protected readonly form = inject(NonNullableFormBuilder).group({ reason: '', note: '' });
  protected readonly status = signal<Status>('idle');
  protected readonly busy = computed(() => this.status() === 'busy');

  /** "A-0219 · Submitted · Fri 9 Oct". */
  protected readonly kicker = computed(() =>
    this.t('kicker', {
      number: this.data.application.number,
      status: this.transloco.translate(`admin.application.status.${this.data.application.status}`),
      date: this.format.shortDate(this.data.application.submittedAt.slice(0, 10) as CalendarDate),
    }),
  );

  protected readonly reasons: FieldOption[] = [
    { value: '', label: this.t('reasonPlaceholder') },
    ...APPLICATION_REJECTION_REASONS.map((reason) => ({
      value: reason,
      label: this.transloco.translate(`admin.application.reasons.${reason}`),
    })),
  ];

  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() => [
    { fieldId: 'reject-reason', message: this.t('invalidSummary', { first: this.data.firstName }) },
  ]);

  private readonly reasonField = viewChild<FormField>('reasonField');
  private readonly summary = viewChild<ErrorSummary>('summary');

  constructor() {
    afterNextRender(() => this.reasonField()?.focus(), { injector: this.injector });
  }

  protected submit(): void {
    if (this.busy()) return;
    const { reason, note } = this.form.getRawValue();
    if (!reason) {
      this.status.set('invalid');
      afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
      return;
    }
    this.status.set('busy');
    this.dialogRef.disableClose = true;
    this.api
      .reject(this.data.application.id, reason as ApplicationRejectionReason, note.trim() || null)
      .subscribe({
        next: (application) => {
          this.dialogRef.disableClose = false;
          this.dialogRef.close(application);
        },
        error: (error: unknown) => {
          this.dialogRef.disableClose = false;
          // A refused reason is named at the field; anything else is the failed state.
          const invalid = error instanceof HttpErrorResponse && error.status === 422;
          this.status.set(invalid ? 'invalid' : 'failed');
        },
      });
  }

  protected close(): void {
    if (!this.busy()) this.dialogRef.close();
  }

  protected t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`admin.rejectDialog.${key}`, params);
  }
}
