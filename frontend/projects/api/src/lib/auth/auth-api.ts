import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable, switchMap } from 'rxjs';
import type {
  CurrentUser,
  PasswordReset,
  PasswordResetLink,
  PasswordResetRequest,
  Registration,
  SignInCredentials,
  SignInResult,
  TwoFactorAnswer,
  VerificationResend,
  VerifiedEmail,
} from '../models/accounts';

/**
 * The session endpoints (accounts/sign-in-and-recover-access). Wrong credentials fail with 422 and
 * `errors.credentials`, whichever was wrong (L2-023.2).
 */
export interface AuthApi {
  /** Signs in, or answers that a code from the authenticator app comes next. */
  signIn(credentials: SignInCredentials): Observable<SignInResult>;
  /** The code step: a current code or a recovery code completes the sign-in (L2-072.3). */
  completeTwoFactor(answer: TwoFactorAnswer): Observable<CurrentUser>;
  /** Ends the session on the server; a session that already ended answers 401. */
  signOut(): Observable<void>;
  me(): Observable<CurrentUser>;
  /**
   * Registers a booker (L2-022). Every valid submission answers the same, whether or not the address
   * has an account; a failed bot check is a 422 on challengeToken.
   */
  register(registration: Registration): Observable<void>;
  /** Opens a verification link; a used, old or unknown one fails with 410 (L2-022.3). */
  verifyEmail(token: string): Observable<VerifiedEmail>;
  /** Sends a new verification link, which revokes the earlier ones. */
  resendVerification(request: VerificationResend): Observable<void>;
  /** Asks for a reset link; the answer is the same for any address. A failed bot check is a 422. */
  forgotPassword(request: PasswordResetRequest): Observable<void>;
  /** Whether a reset link still works, without using it; 410 when it does not. */
  checkPasswordReset(token: string): Observable<PasswordResetLink>;
  /** Sets the new password with the link and signs this browser in (L2-023.4). */
  resetPassword(reset: PasswordReset): Observable<SignInResult>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AuthApi');

@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);

  /**
   * Fetches the CSRF cookie first: the API only accepts a state-changing request that repeats it in
   * `X-XSRF-TOKEN`, which Angular's XSRF interceptor adds (ADR-0015).
   */
  signIn(credentials: SignInCredentials): Observable<SignInResult> {
    return this.http.get('/sanctum/csrf-cookie').pipe(
      switchMap(() => this.http.post<{ data: SignInResult }>('/api/v1/session', credentials)),
      map((response) => response.data),
    );
  }

  completeTwoFactor(answer: TwoFactorAnswer): Observable<CurrentUser> {
    return this.http
      .post<{ data: CurrentUser }>('/api/v1/session/two-factor', answer)
      .pipe(map((response) => response.data));
  }

  signOut(): Observable<void> {
    return this.http.delete<void>('/api/v1/session');
  }

  /** Fetches the CSRF cookie first, as signing in does. */
  register(registration: Registration): Observable<void> {
    return this.http.get('/sanctum/csrf-cookie').pipe(
      switchMap(() => this.http.post('/api/v1/register', registration)),
      map(() => undefined),
    );
  }

  /** Fetches the CSRF cookie first: the link is often opened in a browser that has none yet. */
  verifyEmail(token: string): Observable<VerifiedEmail> {
    return this.http.get('/sanctum/csrf-cookie').pipe(
      switchMap(() => this.http.post<{ data: VerifiedEmail }>('/api/v1/email/verify', { token })),
      map((response) => response.data),
    );
  }

  resendVerification(request: VerificationResend): Observable<void> {
    return this.http.get('/sanctum/csrf-cookie').pipe(
      switchMap(() => this.http.post('/api/v1/email/verification-notification', request)),
      map(() => undefined),
    );
  }

  /** The reset endpoints fetch the CSRF cookie first, as the link is often opened in a new browser. */
  forgotPassword(request: PasswordResetRequest): Observable<void> {
    return this.http.get('/sanctum/csrf-cookie').pipe(
      switchMap(() => this.http.post('/api/v1/password/forgot', request)),
      map(() => undefined),
    );
  }

  checkPasswordReset(token: string): Observable<PasswordResetLink> {
    return this.http.get('/sanctum/csrf-cookie').pipe(
      switchMap(() =>
        this.http.post<{ data: PasswordResetLink }>('/api/v1/password/reset/check', { token }),
      ),
      map((response) => response.data),
    );
  }

  resetPassword(reset: PasswordReset): Observable<SignInResult> {
    return this.http.get('/sanctum/csrf-cookie').pipe(
      switchMap(() => this.http.post<{ data: SignInResult }>('/api/v1/password/reset', reset)),
      map((response) => response.data),
    );
  }

  me(): Observable<CurrentUser> {
    return this.http
      .get<{ data: CurrentUser }>('/api/v1/me')
      .pipe(map((response) => response.data));
  }
}
