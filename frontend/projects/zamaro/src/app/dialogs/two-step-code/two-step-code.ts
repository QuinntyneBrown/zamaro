import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
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
import { ACCOUNT_API } from 'api';
import {
  Alert,
  Button,
  Dialog,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
  Icon,
  List,
  type ListItem,
} from 'components';

/** Turning two-step sign-in off, or getting new recovery codes. */
export type TwoStepCodeMode = 'off' | 'codes';

export interface TwoStepCodeData {
  mode: TwoStepCodeMode;
  /** The account's address, which the "off" email goes to. */
  email: string;
}

/** What the dialog closes with: `off` once two-step sign-in was turned off. */
export type TwoStepCodeResult = 'off' | undefined;

const TITLE_ID = 'two-step-title';
const DESCRIPTION_ID = 'two-step-desc';

/**
 * Opens "Turn off two-step sign-in?" or "Get new recovery codes?" (docs/mocks/dialogs/two-step-code)
 * over account settings: it traps focus, closes on Escape unless a request is out, and returns focus
 * to the button that opened it.
 */
export function openTwoStepCodeDialog(
  injector: Injector,
  data: TwoStepCodeData,
): DialogRef<TwoStepCodeResult, TwoStepCode> {
  return injector
    .get(CdkDialog)
    .open<TwoStepCodeResult, TwoStepCodeData, TwoStepCode>(TwoStepCode, {
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

type Status = 'idle' | 'invalid' | 'busy' | 'failed' | 'done';

/**
 * L2-072.5: a current code from the app, or an unused recovery code, before two-step sign-in is turned
 * off or its recovery codes are replaced. A wrong code is named in the dialog; the new codes show
 * once, in the dialog.
 */
@Component({
  selector: 'zm-two-step-code-dialog',
  imports: [
    Alert,
    Button,
    Dialog,
    ErrorSummary,
    FormField,
    Icon,
    List,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './two-step-code.html',
  styleUrl: './two-step-code.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoStepCode {
  protected readonly dialogRef = inject<DialogRef<TwoStepCodeResult>>(DialogRef);
  protected readonly data = inject<TwoStepCodeData>(DIALOG_DATA);
  private readonly api = inject(ACCOUNT_API);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly titleId = TITLE_ID;
  protected readonly descriptionId = DESCRIPTION_ID;
  protected readonly form = inject(NonNullableFormBuilder).group({ code: [''] });
  protected readonly status = signal<Status>('idle');
  protected readonly codes = signal<string[]>([]);
  protected readonly copied = signal(false);
  protected readonly off = this.data.mode === 'off';
  protected readonly busy = computed(() => this.status() === 'busy');
  protected readonly codeItems = computed<ListItem[]>(() =>
    this.codes().map((code) => ({ id: code, code })),
  );
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() => [
    { fieldId: 'tsc-code', message: this.t('wrongSummary') },
  ]);
  private readonly field = viewChild<FormField>('field');

  constructor() {
    this.afterRender(() => this.field()?.focus());
  }

  protected submit(): void {
    if (this.busy()) return;
    const code = this.form.controls.code.value;
    this.status.set('busy');
    this.dialogRef.disableClose = true;
    const failed = (error: unknown): void => {
      this.dialogRef.disableClose = false;
      const wrong = error instanceof HttpErrorResponse && error.status === 422;
      this.status.set(wrong ? 'invalid' : 'failed');
      // After a failure, focus starts on the way back so a second Enter changes nothing.
      if (!wrong) this.focusById('two-step-back');
    };
    if (this.off) {
      this.api.turnOffTwoFactor(code).subscribe({
        next: () => {
          this.dialogRef.disableClose = false;
          this.dialogRef.close('off');
        },
        error: failed,
      });
      return;
    }
    this.api.newRecoveryCodes(code).subscribe({
      next: (codes) => {
        this.dialogRef.disableClose = false;
        this.codes.set(codes);
        this.status.set('done');
        this.focusById('two-step-saved');
      },
      error: failed,
    });
  }

  protected close(): void {
    if (!this.busy()) this.dialogRef.close();
  }

  protected async copy(): Promise<void> {
    await this.document.defaultView?.navigator.clipboard?.writeText(this.codes().join('\n'));
    this.copied.set(true);
  }

  /** "zamaro-recovery-codes.txt", one code a line. */
  protected download(): void {
    const blob = new Blob([`${this.codes().join('\n')}\n`], { type: 'text/plain' });
    const link = this.document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'zamaro-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  protected t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`accounts.twoStepCode.${key}`, params);
  }

  /** Focuses the button inside a `zm-button` host with this id. */
  private focusById(id: string): void {
    this.afterRender(() =>
      this.document.getElementById(id)?.querySelector<HTMLElement>('button')?.focus(),
    );
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }
}
