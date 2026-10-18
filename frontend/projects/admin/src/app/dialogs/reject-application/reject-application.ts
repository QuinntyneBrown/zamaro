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
  id: number;
  /** "A-0219". */
  number: string;
  name: string;
  /** When it was submitted, Toronto time, ISO 8601. */
  submittedAt: string;
}

/** What the dialog closes with: the rejected application, or nothing when cancelled. */
export type RejectApplicationResult = AdminApplication | undefined;

const TITLE_ID = 'reject-application-title';
const DESCRIPTION_ID = 'reject-application-desc';
export const NOTE_MAX = 1000;

const REASONS: ApplicationRejectionReason[] = [
  'references-unconfirmed',
  'videos-not-leading-worship',
  'outside-service-area',
  'incomplete-or-inaccurate',
  'other',
];

/**
 * Opens "Reject {name}’s application?" (docs/mocks/dialogs/reject-application) over the review
 * screen: it traps focus, closes on Escape unless the rejection is on its way, and returns focus to
 * the Reject button that opened it (L2-101).
 */
export function openRejectApplicationDialog(
  injector: Injector,
  data: RejectApplicationData,
): DialogRef<RejectApplicationResult, RejectApplication> {
  return injector
    .get(CdkDialog)
    .open<RejectApplicationResult, RejectApplicationData, RejectApplication>(RejectApplication, {
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
 * L2-048.2: a reason from the fixed list is required and an optional note of up to 1,000 characters
 * goes with it; both reach the applicant by email. Nothing is sent until the reason is chosen.
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectApplication {
  protected readonly dialogRef = inject<DialogRef<RejectApplicationResult>>(DialogRef);
  protected readonly data = inject<RejectApplicationData>(DIALOG_DATA);
  private readonly api = inject(ADMIN_ARTIST_APPLICATIONS_API);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly injector = inject(Injector);

  protected readonly titleId = TITLE_ID;
  protected readonly descriptionId = DESCRIPTION_ID;
  protected readonly noteMax = NOTE_MAX;
  protected readonly form = inject(NonNullableFormBuilder).group({ reason: [''], note: [''] });
  protected readonly status = signal<Status>('idle');
  protected readonly busy = computed(() => this.status() === 'busy');
  /** The applicant's first name: "Tobi". */
  protected readonly firstName = this.data.name.split(' ')[0] ?? this.data.name;

  protected readonly reasonOptions: FieldOption[] = [
    { value: '', label: this.t('chooseReason') },
    ...REASONS.map((reason) => ({
      value: reason,
      label: this.transloco.translate(`admin.application.rejection.reason.${reason}`),
    })),
  ];

  /** "A-0219 · Submitted · Fri 9 Oct". */
  protected readonly kicker = this.t('kicker', {
    number: this.data.number,
    date: this.format.shortDate(this.data.submittedAt.slice(0, 10) as CalendarDate),
  });

  /** Which fields are wrong after a submit; cleared as they are fixed. */
  protected readonly reasonMissing = signal(false);
  protected readonly noteTooLong = signal(false);

  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() => [
    ...(this.reasonMissing()
      ? [{ fieldId: 'reject-reason', message: this.t('reasonSummary', { name: this.firstName }) }]
      : []),
    ...(this.noteTooLong()
      ? [{ fieldId: 'reject-note', message: this.t('noteSummary', { max: this.max() }) }]
      : []),
  ]);

  private readonly reasonField = viewChild<FormField>('reasonField');

  constructor() {
    afterNextRender(() => this.reasonField()?.focus(), { injector: this.injector });
    this.form.controls.reason.valueChanges.subscribe((value) => {
      if (value) this.reasonMissing.set(false);
    });
    this.form.controls.note.valueChanges.subscribe((value) => {
      if (value.length <= NOTE_MAX) this.noteTooLong.set(false);
    });
  }

  protected submit(): void {
    if (this.busy()) return;
    const { reason, note } = this.form.getRawValue();
    this.reasonMissing.set(!reason);
    this.noteTooLong.set(note.length > NOTE_MAX);
    if (this.reasonMissing() || this.noteTooLong()) {
      this.status.set('invalid');
      return;
    }
    this.status.set('busy');
    this.dialogRef.disableClose = true;
    this.api
      .reject(this.data.id, {
        reason: reason as ApplicationRejectionReason,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      .subscribe({
        next: (rejected) => {
          this.dialogRef.disableClose = false;
          this.dialogRef.close(rejected);
        },
        error: (error: unknown) => {
          this.dialogRef.disableClose = false;
          if (error instanceof HttpErrorResponse && error.status === 422) {
            const errors = (error.error as { errors?: Record<string, string[]> }).errors ?? {};
            this.reasonMissing.set('reason' in errors);
            this.noteTooLong.set('note' in errors);
            this.status.set('invalid');
            return;
          }
          this.status.set('failed');
        },
      });
  }

  protected close(): void {
    if (!this.busy()) this.dialogRef.close();
  }

  protected max(): string {
    return NOTE_MAX.toLocaleString('en-CA');
  }

  protected t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`admin.application.reject.${key}`, params);
  }
}
