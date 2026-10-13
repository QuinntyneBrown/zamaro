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
import {
  afterSignIn,
  AuthService,
  FormatService,
  safeReturnUrl,
  type SessionEndedState,
} from 'api';
import {
  Alert,
  BookingForm,
  Button,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
} from 'components';
import { PageMeta } from '../../shared/page-meta';

type Status = 'idle' | 'submitting' | 'invalid' | 'paused' | 'error';

/**
 * Sign in (docs/mocks/pages/sign-in, L2-023): email and password, then back to the page the person
 * came from (`returnUrl`). Wrong details get one message whichever was wrong, with the password
 * cleared; a failure on Zamaro's side keeps everything typed (L2-108.3). After a session ended
 * (`ended=1`) it says so, with the email filled in when the app sent the person here (L2-073.3).
 * After 5 failures for an address, sign-in is paused for 15 minutes and the card says until when
 * (L2-072.4).
 */
@Component({
  selector: 'zm-sign-in-page',
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
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly format = inject(FormatService);

  protected readonly form = inject(NonNullableFormBuilder).group({ email: '', password: '' });
  protected readonly status = signal<Status>('idle');
  protected readonly sessionEnded = this.route.snapshot.queryParamMap.get('ended') === '1';
  /** "Create an account" carries the way back on to sign-up. */
  protected readonly returnQuery = this.returnQueryFrom(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );
  protected readonly busy = computed(() => this.status() === 'submitting');
  /** "10:57 a.m.": when a paused sign-in resumes. */
  protected readonly pausedUntil = signal('');
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() =>
    this.status() === 'invalid'
      ? [{ fieldId: 'email', message: this.transloco.translate('accounts.signIn.incorrect') }]
      : [],
  );

  private readonly summary = viewChild(ErrorSummary);
  private readonly emailField = viewChild.required<FormField>('emailField');
  private readonly passwordField = viewChild.required<FormField>('passwordField');

  constructor() {
    inject(PageMeta).set({
      title: this.transloco.translate('accounts.signIn.pageTitle'),
      index: false,
    });
    const ended = this.router.currentNavigation()?.extras.state as SessionEndedState | undefined;
    if (this.sessionEnded && ended?.email) this.form.controls.email.setValue(ended.email);
    // Focus starts in the first empty field, so the person can type at once.
    this.afterRender(() =>
      (this.form.controls.email.value ? this.passwordField() : this.emailField()).focus(),
    );
  }

  protected submit(): void {
    if (this.busy()) return;
    const wasInvalid = this.status() === 'invalid';
    this.status.set('submitting');
    const returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    this.auth.signIn(this.form.getRawValue()).subscribe({
      next: (result) =>
        // With two-step sign-in on, the code step completes it (L2-072.3).
        void ('twoFactorRequired' in result
          ? this.router.navigate(['/account/sign-in/verify'], {
              queryParams: returnUrl === '/' ? {} : { returnUrl },
              state: { email: result.email },
            })
          : this.router.navigateByUrl(afterSignIn(this.router, result, returnUrl))),
      error: (error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 429 &&
          error.error?.pausedUntil
        ) {
          this.pausedUntil.set(this.format.time(error.error.pausedUntil));
          this.status.set('paused');
        } else if (error instanceof HttpErrorResponse && error.status === 422) {
          this.form.controls.password.setValue('');
          this.status.set('invalid');
          // A summary already on screen is not created again, so it does not take focus itself.
          if (wasInvalid) this.afterRender(() => this.summary()?.focus());
        } else {
          this.status.set('error');
          this.afterRender(() => this.passwordField().focus());
        }
      },
    });
  }

  private returnQueryFrom(returnUrl: string | null): Record<string, string> {
    const safe = safeReturnUrl(returnUrl);
    return safe === '/' ? {} : { returnUrl: safe };
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }
}
