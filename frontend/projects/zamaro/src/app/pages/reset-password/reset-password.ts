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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService, BOT_CHALLENGE, FormatService } from 'api';
import {
  Alert,
  BookingForm,
  Button,
  ButtonLink,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
  Icon,
  Skeleton,
  Stamp,
} from 'components';
import { switchMap, timer } from 'rxjs';
import { PageMeta } from '../../shared/page-meta';

type Status = 'checking' | 'idle' | 'invalid' | 'submitting' | 'error' | 'expired' | 'changed';
type Field = 'password' | 'confirmation';

/** A field's message under it, and the shorter line for the error summary. */
interface FieldError {
  message: string;
  summary: string;
}

const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
/** How long "Sent" stays before another link can be asked for. */
const SENT_FOR_MS = 60_000;

/**
 * Choose a new password (docs/mocks/pages/reset-password, L2-023.3–.4). The link's token is checked
 * once the browser has taken over, without using it up; then the new password twice. Saving signs
 * this browser in and ends every other session. A used, old or unknown link has expired: one that
 * existed names its account, and a new link can be sent to it at once.
 */
@Component({
  selector: 'zm-reset-password-page',
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
    Skeleton,
    Stamp,
    TranslocoPipe,
  ],
  templateUrl: './reset-password.html',
  // The stage and card of sign-in, and the stacked buttons and status line of sign-up.
  styleUrls: ['../sign-in/sign-in.scss', '../sign-up/sign-up.scss', './reset-password.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private readonly auth = inject(AuthService);
  private readonly botChallenge = inject(BOT_CHALLENGE);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';

  protected readonly form = inject(NonNullableFormBuilder).group({
    password: '',
    confirmation: '',
  });
  protected readonly status = signal<Status>('checking');
  protected readonly busy = computed(() => this.status() === 'submitting');
  protected readonly errors = signal<Partial<Record<Field, FieldError>>>({});
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() =>
    (['password', 'confirmation'] as const).flatMap((field) => {
      const error = this.errors()[field];
      return error ? [{ fieldId: this.fieldId(field), message: error.summary }] : [];
    }),
  );
  /** The account the link belongs to, once known. */
  protected readonly email = signal<string | null>(null);
  /** "11:31 a.m.": when a usable link runs out. */
  protected readonly expiresAt = signal('');
  /** "8:14 a.m.": when an expired link that existed was sent. */
  protected readonly sentAt = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly sent = signal(false);

  private readonly summary = viewChild(ErrorSummary);
  private readonly passwordField = viewChild<FormField>('passwordField');

  constructor() {
    inject(PageMeta).set({
      title: this.transloco.translate('accounts.resetPassword.pageTitle'),
      index: false,
    });
    afterNextRender(() => this.check());
  }

  protected submit(): void {
    if (this.busy()) return;
    const wasInvalid = this.status() === 'invalid';
    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.showErrors(errors, wasInvalid);
      return;
    }
    this.errors.set({});
    this.status.set('submitting');
    const { password, confirmation } = this.form.getRawValue();
    this.auth
      .resetPassword({ token: this.token, password, passwordConfirmation: confirmation })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.status.set('changed');
          this.afterRender(() => this.document.getElementById('card-title')?.focus());
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 410) {
            this.expired(error);
          } else if (error instanceof HttpErrorResponse && error.status === 422) {
            this.showErrors(this.fromServer(error.error?.errors ?? {}), wasInvalid);
          } else {
            this.status.set('error');
            this.afterRender(() => this.passwordField()?.focus());
          }
        },
      });
  }

  /** A new link to the account an expired link belonged to; "Sent" stays for a minute. */
  protected sendNewLink(): void {
    const email = this.email();
    if (!email || this.sending() || this.sent()) return;
    this.sending.set(true);
    this.botChallenge
      .token('forgot-password')
      .pipe(
        switchMap((challengeToken) => this.auth.forgotPassword({ email, challengeToken })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.sent.set(true);
          timer(SENT_FOR_MS)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.sent.set(false));
        },
        error: () => this.sending.set(false),
      });
  }

  private check(): void {
    this.auth
      .checkPasswordReset(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ email, expiresAt }) => {
          this.email.set(email);
          this.expiresAt.set(this.format.time(expiresAt));
          this.status.set('idle');
          this.afterRender(() => this.passwordField()?.focus());
        },
        error: (error: unknown) => this.expired(error),
      });
  }

  /** Any failure to check the link shows it as expired; one that existed names its account. */
  private expired(error: unknown): void {
    const problem = error instanceof HttpErrorResponse ? error.error : null;
    if (problem?.email && problem?.sentAt) {
      this.email.set(problem.email);
      this.sentAt.set(this.format.time(problem.sentAt));
    } else {
      this.email.set(null);
      this.sentAt.set(null);
    }
    this.status.set('expired');
  }

  private validate(): Partial<Record<Field, FieldError>> {
    const { password, confirmation } = this.form.getRawValue();
    const errors: Partial<Record<Field, FieldError>> = {};
    const length = this.lengthError(password);
    if (length) errors.password = length;
    if (password !== confirmation) errors.confirmation = this.error('mismatch');
    return errors;
  }

  /** The API's 422: a breached password, or a field the page could not check. */
  private fromServer(serverErrors: Record<string, string[]>): Partial<Record<Field, FieldError>> {
    const errors: Partial<Record<Field, FieldError>> = {};
    if (serverErrors['password']) {
      errors.password =
        this.lengthError(this.form.controls.password.value) ?? this.error('breached');
    }
    if (serverErrors['passwordConfirmation']) errors.confirmation = this.error('mismatch');
    return errors;
  }

  private lengthError(password: string): FieldError | null {
    const count = [...password].length;
    if (count < PASSWORD_MIN) return this.error('short');
    if (count > PASSWORD_MAX) return this.error('long');
    return null;
  }

  private showErrors(errors: Partial<Record<Field, FieldError>>, wasInvalid: boolean): void {
    this.errors.set(errors);
    this.status.set('invalid');
    // A summary already on screen is not created again, so it does not take focus itself.
    if (wasInvalid) this.afterRender(() => this.summary()?.focus());
  }

  private error(key: string): FieldError {
    return {
      message: this.transloco.translate(`accounts.resetPassword.${key}`),
      summary: this.transloco.translate(`accounts.resetPassword.${key}Summary`),
    };
  }

  protected fieldId(field: Field): string {
    return field === 'password' ? 'new-password' : 'confirm-password';
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }
}
