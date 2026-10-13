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
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  AuthService,
  BOT_CHALLENGE,
  CONSENT_API,
  type CurrentLegalDocuments,
  safeReturnUrl,
} from 'api';
import {
  Alert,
  BookingForm,
  Button,
  ButtonLink,
  Checkbox,
  ErrorSummary,
  type ErrorSummaryItem,
  FormField,
  Icon,
} from 'components';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type Observable, of, switchMap, tap, timer } from 'rxjs';
import { PageMeta } from '../../shared/page-meta';

type Status = 'idle' | 'submitting' | 'invalid' | 'challenge' | 'error' | 'sent';
type Field = 'name' | 'email' | 'password' | 'terms';

/** A field's message under it, and the shorter line for the error summary (docs/mocks/pages/sign-up/invalid). */
interface FieldError {
  message: string;
  summary: string;
}

const FIELDS: readonly Field[] = ['name', 'email', 'password', 'terms'];
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
/** How long "Sent" stays before another link can be asked for. */
const SENT_FOR_MS = 60_000;

/**
 * Sign up (docs/mocks/pages/sign-up, L2-022): full name, email and password, the required terms box
 * and the separate, unticked news box (L2-080.2). The form checks what it can before sending; the
 * bot check runs on submit (L2-077.4). Every value is kept after any failure (L2-108.3). The answer
 * is the same whether or not the address has an account (L2-022.2): "Check your email to finish
 * signing up". The guest stays signed out until they verify.
 */
@Component({
  selector: 'zm-sign-up-page',
  imports: [
    Alert,
    BookingForm,
    Button,
    ButtonLink,
    Checkbox,
    ErrorSummary,
    FormField,
    Icon,
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './sign-up.html',
  // The same stage and card layout as sign-in.
  styleUrls: ['../sign-in/sign-in.scss', './sign-up.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUp {
  private readonly auth = inject(AuthService);
  private readonly consent = inject(CONSENT_API);
  private readonly botChallenge = inject(BOT_CHALLENGE);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: '',
    email: '',
    password: '',
    terms: false,
    news: false,
  });
  protected readonly status = signal<Status>('idle');
  protected readonly busy = computed(() => this.status() === 'submitting');
  protected readonly errors = signal<Partial<Record<Field, FieldError>>>({});
  protected readonly summaryItems = computed<ErrorSummaryItem[]>(() =>
    FIELDS.flatMap((field) => {
      const error = this.errors()[field];
      return error ? [{ fieldId: field, message: error.summary }] : [];
    }),
  );
  /** The address the link went to, as the API wrote it. */
  protected readonly sentTo = signal('');
  protected readonly resending = signal(false);
  protected readonly resent = signal(false);

  /** Back to the page the guest came from, after signing in or verifying. */
  protected readonly returnUrl = safeReturnUrl(
    inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'),
  );
  protected readonly returnQuery = this.returnUrl === '/' ? {} : { returnUrl: this.returnUrl };

  /** The versions the form shows, sent back so the version stored is the one the person saw. */
  private documents: CurrentLegalDocuments | null = null;

  private readonly summary = viewChild(ErrorSummary);
  private readonly nameField = viewChild<FormField>('nameField');
  private readonly emailField = viewChild<FormField>('emailField');

  constructor() {
    inject(PageMeta).set({
      title: this.transloco.translate('accounts.signUp.pageTitle'),
      index: false,
    });
    this.loadDocuments().subscribe({ error: () => undefined });
    this.afterRender(() => this.nameField()?.focus());
  }

  protected submit(): void {
    if (this.busy()) return;
    const wasInvalid = this.status() === 'invalid';
    const errors = this.check();
    if (Object.keys(errors).length) {
      this.showErrors(errors, wasInvalid);
      return;
    }

    this.errors.set({});
    this.status.set('submitting');
    this.lockBoxes(true);
    const { name, email, password, terms, news } = this.form.getRawValue();
    (this.documents ? of(this.documents) : this.loadDocuments())
      .pipe(
        switchMap((documents) =>
          this.botChallenge.token('register').pipe(
            switchMap((challengeToken) =>
              this.auth.register({
                name,
                email,
                password,
                acceptedTerms: terms,
                marketingOptIn: news,
                termsVersion: documents.terms.version,
                privacyPolicyVersion: documents.privacyPolicy.version,
                challengeToken,
                returnUrl: this.returnUrl,
              }),
            ),
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.sentTo.set(email.trim().toLowerCase());
          this.status.set('sent');
          this.afterRender(() => this.document.getElementById('card-title')?.focus());
        },
        error: (error: unknown) => this.failed(error, wasInvalid),
      });
  }

  /**
   * "Resend the email": a new link to the address just typed, which revokes the earlier one. The
   * answer is the same for any address; "Sent" stays for a minute.
   */
  protected resend(): void {
    if (this.resending() || this.resent()) return;
    this.resending.set(true);
    this.auth
      .resendVerification({ email: this.sentTo(), returnUrl: this.returnUrl })
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

  /** "Wrong address? Start again": back to the form with everything kept, in Email. */
  protected startAgain(event: Event): void {
    event.preventDefault();
    this.lockBoxes(false);
    this.status.set('idle');
    this.afterRender(() => this.emailField()?.focus());
  }

  private failed(error: unknown, wasInvalid: boolean): void {
    this.lockBoxes(false);
    if (!(error instanceof HttpErrorResponse)) {
      this.status.set('error');
      return;
    }
    const serverErrors = (error.error?.errors ?? {}) as Record<string, string[]>;
    if (error.status === 422 && serverErrors['challengeToken']) {
      this.status.set('challenge');
    } else if (error.status === 422 && Object.keys(serverErrors).some((key) => this.field(key))) {
      this.showErrors(this.fromServer(serverErrors), wasInvalid);
    } else {
      // A 409 means the terms changed while the form was open: show the new versions next time.
      if (error.status === 409) this.loadDocuments().subscribe({ error: () => undefined });
      this.status.set('error');
    }
  }

  private showErrors(errors: Partial<Record<Field, FieldError>>, wasInvalid: boolean): void {
    this.errors.set(errors);
    this.status.set('invalid');
    // A summary already on screen is not created again, so it does not take focus itself.
    if (wasInvalid) this.afterRender(() => this.summary()?.focus());
  }

  /** What the form can tell before sending. */
  private check(): Partial<Record<Field, FieldError>> {
    const { name, email, password, terms } = this.form.getRawValue();
    const errors: Partial<Record<Field, FieldError>> = {};
    if (!name.trim()) errors.name = this.error('nameMissing');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = this.error('emailInvalid');
    const passwordError = this.passwordLengthError(password);
    if (passwordError) errors.password = passwordError;
    if (!terms) errors.terms = this.error('termsMissing');
    return errors;
  }

  /** The API's 422 on a field the form could not check, such as a breached password. */
  private fromServer(serverErrors: Record<string, string[]>): Partial<Record<Field, FieldError>> {
    const errors: Partial<Record<Field, FieldError>> = {};
    for (const key of Object.keys(serverErrors)) {
      const field = this.field(key);
      if (field === 'name') errors.name = this.error('nameMissing');
      if (field === 'email') errors.email = this.error('emailInvalid');
      if (field === 'terms') errors.terms = this.error('termsMissing');
      if (field === 'password') {
        errors.password =
          this.passwordLengthError(this.form.controls.password.value) ??
          this.error('passwordBreached');
      }
    }
    return errors;
  }

  private passwordLengthError(password: string): FieldError | null {
    const count = [...password].length;
    if (count < PASSWORD_MIN) return this.error('passwordShort', { count });
    if (count > PASSWORD_MAX) return this.error('passwordLong', { count });
    return null;
  }

  private field(key: string): Field | null {
    if (key === 'acceptedTerms') return 'terms';
    return (FIELDS as readonly string[]).includes(key) ? (key as Field) : null;
  }

  private error(key: string, params: Record<string, unknown> = {}): FieldError {
    return {
      message: this.transloco.translate(`accounts.signUp.${key}`, params),
      summary: this.transloco.translate(`accounts.signUp.${key}Summary`, params),
    };
  }

  /** The boxes are disabled while the account is created (checkbox CRD D-9); their values stay. */
  private lockBoxes(locked: boolean): void {
    for (const box of [this.form.controls.terms, this.form.controls.news]) {
      if (locked) box.disable();
      else box.enable();
    }
  }

  private loadDocuments(): Observable<CurrentLegalDocuments> {
    return this.consent.currentDocuments().pipe(tap((documents) => (this.documents = documents)));
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }
}
