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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { afterSignIn, AuthService, FormatService, safeReturnUrl } from 'api';
import {
  Alert,
  BookingForm,
  Button,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
} from 'components';
import { PageMeta } from '../../shared/page-meta';

type Mode = 'code' | 'recovery';
type Status = 'idle' | 'invalid' | 'submitting' | 'error' | 'paused';

/** What the sign-in page passes on: the account being signed in to. */
export interface TwoFactorState {
  email?: string;
}

/**
 * The code step of signing in at `/account/sign-in/verify` (docs/mocks/pages/mfa-challenge,
 * L2-072.3–.4): after the right password, a code from the authenticator app, or a recovery code
 * instead, completes the sign-in and returns the person to where they were going. Wrong codes count
 * toward the same pause as wrong passwords; a step that ran out goes back to sign in.
 */
@Component({
  selector: 'zm-mfa-challenge-page',
  imports: [
    Alert,
    BookingForm,
    Button,
    ErrorSummary,
    FormField,
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './mfa-challenge.html',
  styleUrl: '../sign-in/sign-in.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaChallenge {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly format = inject(FormatService);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly returnUrl = safeReturnUrl(
    inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'),
  );

  protected readonly form = inject(NonNullableFormBuilder).group({ code: [''] });
  protected readonly mode = signal<Mode>('code');
  protected readonly status = signal<Status>('idle');
  protected readonly pausedUntil = signal('');
  /** The account being signed in to, when the sign-in page passed it on. */
  protected readonly email =
    (this.router.currentNavigation()?.extras.state as TwoFactorState | undefined)?.email ?? null;
  protected readonly busy = computed(() => this.status() === 'submitting');
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() => [
    {
      fieldId: this.fieldId(),
      message: this.transloco.translate(
        this.mode() === 'code'
          ? 'accounts.mfaChallenge.codeWrongSummary'
          : 'accounts.mfaChallenge.recoveryWrongSummary',
      ),
    },
  ]);
  private readonly field = viewChild<FormField>('field');

  constructor() {
    inject(PageMeta).set({
      title: this.transloco.translate('accounts.mfaChallenge.pageTitle'),
      index: false,
    });
    this.afterRender(() => this.field()?.focus());
  }

  protected fieldId(): string {
    return this.mode() === 'code' ? 'code' : 'recovery-code';
  }

  /** "Use a recovery code instead" and back. */
  protected switchMode(event: Event, mode: Mode): void {
    event.preventDefault();
    this.mode.set(mode);
    this.form.reset();
    this.status.set('idle');
    this.afterRender(() => this.field()?.focus());
  }

  protected verify(): void {
    if (this.busy() || this.status() === 'paused') return;
    const wasInvalid = this.status() === 'invalid';
    const value = this.form.controls.code.value;
    this.status.set('submitting');
    this.auth
      .completeTwoFactor(this.mode() === 'code' ? { code: value } : { recoveryCode: value })
      .subscribe({
        next: (user) =>
          void this.router.navigateByUrl(afterSignIn(this.router, user, this.returnUrl)),
        error: (error: unknown) => {
          if (!(error instanceof HttpErrorResponse)) {
            this.status.set('error');
          } else if (error.status === 401) {
            // The password step ran out or never happened: start again.
            void this.router.navigate(['/sign-in'], {
              queryParams: this.returnUrl === '/' ? {} : { returnUrl: this.returnUrl },
            });
          } else if (error.status === 429 && error.error?.pausedUntil) {
            this.pausedUntil.set(this.format.time(error.error.pausedUntil));
            this.status.set('paused');
          } else if (error.status === 422) {
            this.status.set('invalid');
            if (wasInvalid) this.afterRender(() => this.summary()?.focus());
          } else {
            this.status.set('error');
          }
        },
      });
  }

  private readonly summary = viewChild(ErrorSummary);

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }
}
