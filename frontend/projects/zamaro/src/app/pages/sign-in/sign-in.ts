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
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService, safeReturnUrl, type SessionEndedState } from 'api';
import {
  Alert,
  BookingForm,
  Button,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
} from 'components';
import { PageMeta } from '../../shared/page-meta';

type Status = 'idle' | 'submitting' | 'invalid' | 'error';

/**
 * Sign in (docs/mocks/pages/sign-in, L2-023): email and password, then back to the page the person
 * came from (`returnUrl`). Wrong details get one message whichever was wrong, with the password
 * cleared; a failure on Zamaro's side keeps everything typed (L2-108.3). After a session ended
 * (`ended=1`) it says so, with the email filled in when the app sent the person here (L2-073.3).
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

  protected readonly form = inject(NonNullableFormBuilder).group({ email: '', password: '' });
  protected readonly status = signal<Status>('idle');
  protected readonly sessionEnded = this.route.snapshot.queryParamMap.get('ended') === '1';
  protected readonly busy = computed(() => this.status() === 'submitting');
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
    this.auth.signIn(this.form.getRawValue()).subscribe({
      next: () =>
        void this.router.navigateByUrl(
          safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
        ),
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 422) {
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

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }
}
