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
import { AuthService, BOT_CHALLENGE } from 'api';
import {
  Alert,
  BookingForm,
  Button,
  ButtonLink,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
  Icon,
} from 'components';
import { type Observable, switchMap, timer } from 'rxjs';
import { PageMeta } from '../../shared/page-meta';

type Status = 'idle' | 'submitting' | 'invalid' | 'challenge' | 'error' | 'sent';

/** How long "Sent" stays before another link can be asked for. */
const SENT_FOR_MS = 60_000;

/**
 * Forgot your password (docs/mocks/pages/forgot-password, L2-023.3): the email the person signs in
 * with, then "Check your email" whether or not it has an account. The bot check runs on submit
 * (L2-077.4), and the email stays after any failure (L2-108.3).
 */
@Component({
  selector: 'zm-forgot-password-page',
  imports: [
    Alert,
    BookingForm,
    Button,
    ButtonLink,
    ErrorSummary,
    FormField,
    Icon,
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './forgot-password.html',
  // The stage and card of sign-in, and the check-your-email card of sign-up.
  styleUrls: ['../sign-in/sign-in.scss', '../sign-up/sign-up.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  private readonly botChallenge = inject(BOT_CHALLENGE);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = inject(NonNullableFormBuilder).group({ email: '' });
  protected readonly status = signal<Status>('idle');
  protected readonly busy = computed(() => this.status() === 'submitting');
  protected readonly invalidMessage = computed(() =>
    this.status() === 'invalid'
      ? this.transloco.translate('accounts.forgotPassword.emailInvalid')
      : null,
  );
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() => {
    const message = this.invalidMessage();
    return message ? [{ fieldId: 'email', message }] : [];
  });
  protected readonly resending = signal(false);
  protected readonly resent = signal(false);

  private readonly summary = viewChild(ErrorSummary);
  private readonly emailField = viewChild<FormField>('emailField');

  constructor() {
    inject(PageMeta).set({
      title: this.transloco.translate('accounts.forgotPassword.pageTitle'),
      index: false,
    });
    this.afterRender(() => this.emailField()?.focus());
  }

  protected submit(): void {
    if (this.busy()) return;
    const wasInvalid = this.status() === 'invalid';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.controls.email.value.trim())) {
      this.status.set('invalid');
      if (wasInvalid) this.afterRender(() => this.summary()?.focus());
      return;
    }
    this.status.set('submitting');
    this.send().subscribe({
      next: () => {
        this.status.set('sent');
        this.afterRender(() => this.document.getElementById('card-title')?.focus());
      },
      error: (error: unknown) => {
        const challenge =
          error instanceof HttpErrorResponse &&
          error.status === 422 &&
          !!error.error?.errors?.['challengeToken'];
        this.status.set(challenge ? 'challenge' : 'error');
      },
    });
  }

  /** "Send it again": another link, which replaces the first; "Sent" stays for a minute. */
  protected sendAgain(): void {
    if (this.resending() || this.resent()) return;
    this.resending.set(true);
    this.send()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resending.set(false);
          this.resent.set(true);
          timer(SENT_FOR_MS)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.resent.set(false));
        },
        error: () => this.resending.set(false),
      });
  }

  private send(): Observable<void> {
    const email = this.form.controls.email.value.trim();
    return this.botChallenge
      .token('forgot-password')
      .pipe(switchMap((challengeToken) => this.auth.forgotPassword({ email, challengeToken })));
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }
}
