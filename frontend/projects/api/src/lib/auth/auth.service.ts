import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, type Observable, of, shareReplay, tap, throwError } from 'rxjs';
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
import { AUTH_API } from './auth-api';

/**
 * Who is signed in on this browser, as a signal, and the ways to change it. The server renders
 * every page signed out (ADR-0017); the browser asks `/me` once it has taken over.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AUTH_API);
  private readonly user = signal<CurrentUser | null>(null);
  /** Bumped by every sign-in and sign-out, so a slow `/me` never overwrites a newer answer. */
  private changes = 0;

  /** The first answer from `/me` in this browser, shared by the shell and the route guards. */
  private first?: Observable<CurrentUser | null>;

  /** The signed-in person, or null for a guest. */
  readonly currentUser = this.user.asReadonly();

  /** Asks the API who holds this browser's session. Call it in the browser only. */
  load(): void {
    (this.changes === 0 ? this.whenKnown() : this.ask()).subscribe();
  }

  /**
   * Who is signed in, once known: at once after a sign-in, sign-out or earlier answer, else after the
   * first `/me` (which this starts). Call it in the browser only.
   */
  whenKnown(): Observable<CurrentUser | null> {
    if (this.changes > 0) return of(this.user());
    this.first ??= this.ask().pipe(shareReplay(1));
    return this.first;
  }

  /** The person after a change made elsewhere, such as a new name (accounts/manage-account-settings). */
  replace(user: CurrentUser): void {
    this.set(user);
  }

  private ask(): Observable<CurrentUser | null> {
    const asked = this.changes;
    return this.api.me().pipe(
      catchError(() => of(null)),
      tap((user) => {
        if (asked === this.changes) this.set(user);
      }),
    );
  }

  /** Signs in; with two-step sign-in on, answers that the code step comes next and signs no one in. */
  signIn(credentials: SignInCredentials): Observable<SignInResult> {
    return this.api.signIn(credentials).pipe(tap((result) => this.signedIn(result)));
  }

  /** The code step: a current code or a recovery code completes the sign-in (L2-072.3). */
  completeTwoFactor(answer: TwoFactorAnswer): Observable<CurrentUser> {
    return this.api.completeTwoFactor(answer).pipe(tap((user) => this.set(user)));
  }

  /**
   * Ends the session on the server, then forgets the person here (L2-023.5). A session that had
   * already ended answers 401, which is signed out too.
   */
  signOut(): Observable<void> {
    return this.api.signOut().pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 401
          ? of(undefined)
          : throwError(() => error),
      ),
      map(() => this.clear()),
    );
  }

  /** Registers a booker; they stay a guest until they verify and sign in (L2-022.1). */
  register(registration: Registration): Observable<void> {
    return this.api.register(registration);
  }

  /**
   * Opens a verification link (L2-022.3). Verifying signs no one in; a person already signed in on
   * this browser is asked for again, so the header and banners see the verified address.
   */
  verifyEmail(token: string): Observable<VerifiedEmail> {
    return this.api.verifyEmail(token).pipe(
      tap(() => {
        if (this.user()) this.load();
      }),
    );
  }

  /** Sends a new verification link; the answer says nothing about whether one was due. */
  resendVerification(request: VerificationResend = {}): Observable<void> {
    return this.api.resendVerification(request);
  }

  /** Asks for a reset link (L2-023.3). */
  forgotPassword(request: PasswordResetRequest): Observable<void> {
    return this.api.forgotPassword(request);
  }

  checkPasswordReset(token: string): Observable<PasswordResetLink> {
    return this.api.checkPasswordReset(token);
  }

  /** Sets the new password; this browser is then signed in as the account (L2-023.4). */
  resetPassword(reset: PasswordReset): Observable<SignInResult> {
    return this.api.resetPassword(reset).pipe(tap((result) => this.signedIn(result)));
  }

  /** Forgets the person on this browser without asking the server. */
  clear(): void {
    this.set(null);
  }

  private signedIn(result: SignInResult): void {
    if (!('twoFactorRequired' in result)) this.set(result);
  }

  private set(user: CurrentUser | null): void {
    this.changes++;
    this.user.set(user);
  }
}
