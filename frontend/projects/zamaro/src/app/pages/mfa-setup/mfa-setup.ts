import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ACCOUNT_API, AuthService } from 'api';
import {
  Alert,
  BookingForm,
  Button,
  ButtonLink,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
  Icon,
  List,
  type ListItem,
  Skeleton,
} from 'components';
import { PageMeta } from '../../shared/page-meta';

type Status = 'loading' | 'ready' | 'invalid' | 'submitting' | 'error' | 'codes';

/** How long "Copied" stays on the copy button. */
const COPIED_FOR_MS = 3000;

/**
 * Turn on two-step sign-in at `/account/security/mfa` (docs/mocks/pages/mfa-setup, L2-072.3): a new key
 * as a QR code and as text, then the first code from the app turns it on and shows the 10 recovery
 * codes once, to copy or download. Leaving before then changes nothing.
 */
@Component({
  selector: 'zm-mfa-setup-page',
  imports: [
    Alert,
    BookingForm,
    Button,
    ButtonLink,
    ErrorSummary,
    FormField,
    Icon,
    List,
    ReactiveFormsModule,
    RouterLink,
    Skeleton,
    TranslocoPipe,
  ],
  templateUrl: './mfa-setup.html',
  styleUrls: ['../sign-in/sign-in.scss', './mfa-setup.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaSetup {
  private readonly api = inject(ACCOUNT_API);
  private readonly auth = inject(AuthService);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  protected readonly form = inject(NonNullableFormBuilder).group({ code: [''] });
  protected readonly status = signal<Status>('loading');
  protected readonly key = signal('');
  /** Changes with each key, so the browser fetches the new QR code. */
  protected readonly qrSrc = signal('');
  protected readonly codes = signal<string[]>([]);
  protected readonly copied = signal(false);
  protected readonly email = computed(() => this.auth.currentUser()?.email ?? '');
  protected readonly busy = computed(() => this.status() === 'submitting');
  protected readonly codeItems = computed<ListItem[]>(() =>
    this.codes().map((code) => ({ id: code, code })),
  );
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() => [
    { fieldId: 'code', message: this.t('codeWrongSummary') },
  ]);
  private readonly codeField = viewChild<FormField>('codeField');

  constructor() {
    inject(PageMeta).set({ title: this.t('pageTitle'), index: false });
    this.api
      .beginTwoFactor()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ key }) => {
          this.key.set(key);
          this.qrSrc.set(`/api/v1/account/two-factor/qr?k=${encodeURIComponent(key.slice(0, 4))}`);
          this.status.set('ready');
          this.afterRender(() => this.codeField()?.focus());
        },
        error: () => this.status.set('error'),
      });
  }

  protected turnOn(): void {
    if (this.busy() || !this.key()) return;
    this.status.set('submitting');
    this.api
      .confirmTwoFactor(this.form.controls.code.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (codes) => {
          this.codes.set(codes);
          this.status.set('codes');
          this.auth.load();
          this.afterRender(() => this.document.getElementById('card-title')?.focus());
        },
        error: (error: unknown) => {
          const wrong = error instanceof HttpErrorResponse && error.status === 422;
          this.status.set(wrong ? 'invalid' : 'error');
        },
      });
  }

  protected async copy(): Promise<void> {
    await this.document.defaultView?.navigator.clipboard?.writeText(this.codes().join('\n'));
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), COPIED_FOR_MS);
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

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }

  private t(key: string, params: Record<string, unknown> = {}): string {
    return this.transloco.translate(`accounts.mfaSetup.${key}`, params);
  }
}
