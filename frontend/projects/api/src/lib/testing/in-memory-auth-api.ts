import { HttpErrorResponse } from '@angular/common/http';
import { type Observable, of, throwError } from 'rxjs';
import type { AuthApi } from '../auth/auth-api';
import type {
  CurrentUser,
  PasswordReset,
  PasswordResetLink,
  Registration,
  SignInCredentials,
  VerifiedEmail,
} from '../models/accounts';

/** Naomi Fraser, the booker in docs/mocks/README.md. */
export const NAOMI: CurrentUser = {
  id: 1,
  name: 'Naomi Fraser',
  email: 'naomi.fraser@riversidecc.ca',
  initials: 'NF',
  roles: ['booker'],
  emailVerified: true,
  pendingEmail: null,
  mfaEnabled: false,
  church: {
    name: 'Riverside Community Church',
    city: 'Burlington',
    latitude: 43.325,
    longitude: -79.799,
  },
  themePreference: null,
  termsAcceptanceRequired: false,
};

/** In-memory AuthApi for scenarios and component tests: one account and its password. */
export class InMemoryAuthApi implements AuthApi {
  private signedIn: CurrentUser | null = null;

  constructor(
    private account: CurrentUser = NAOMI,
    private password = 'hosanna-in-the-highest',
  ) {}

  signIn({ email, password }: SignInCredentials): Observable<CurrentUser> {
    if (email.trim().toLowerCase() !== this.account.email || password !== this.password) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { status: 422, errors: { credentials: ['Email or password is incorrect.'] } },
          }),
      );
    }
    this.signedIn = this.account;
    return of(this.account);
  }

  signOut(): Observable<void> {
    if (!this.signedIn) return throwError(() => new HttpErrorResponse({ status: 401 }));
    this.signedIn = null;
    return of(undefined);
  }

  /** Accepts every registration, as the API answers alike, except a `fail` bot challenge token. */
  register({ challengeToken }: Registration): Observable<void> {
    if (challengeToken === 'fail') {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              status: 422,
              errors: { challengeToken: ['We couldn’t check that you’re a person.'] },
            },
          }),
      );
    }
    return of(undefined);
  }

  /** Verifies the account's address for any token except `e2e-unknown`, which has expired. */
  verifyEmail(token: string): Observable<VerifiedEmail> {
    if (token === 'e2e-unknown') {
      return throwError(() => new HttpErrorResponse({ status: 410 }));
    }
    this.account = { ...this.account, emailVerified: true };
    return of({ name: this.account.name });
  }

  resendVerification(): Observable<void> {
    return of(undefined);
  }

  forgotPassword(): Observable<void> {
    return of(undefined);
  }

  /** Every token works for an hour except `e2e-unknown`, which has expired. */
  checkPasswordReset(token: string): Observable<PasswordResetLink> {
    return token === 'e2e-unknown'
      ? throwError(() => new HttpErrorResponse({ status: 410 }))
      : of({ email: this.account.email, expiresAt: '2026-10-09T11:00:00-04:00' });
  }

  resetPassword({ token, password }: PasswordReset): Observable<CurrentUser> {
    if (token === 'e2e-unknown') return throwError(() => new HttpErrorResponse({ status: 410 }));
    this.password = password;
    this.signedIn = this.account;
    return of(this.account);
  }

  completeTwoFactor(): Observable<CurrentUser> {
    this.signedIn = this.account;
    return of(this.account);
  }

  me(): Observable<CurrentUser> {
    return this.signedIn
      ? of(this.signedIn)
      : throwError(() => new HttpErrorResponse({ status: 401 }));
  }
}
