import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, type Observable, of, tap, throwError } from 'rxjs';
import type { CurrentUser, SignInCredentials } from '../models/accounts';
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

  /** The signed-in person, or null for a guest. */
  readonly currentUser = this.user.asReadonly();

  /** Asks the API who holds this browser's session. Call it in the browser only. */
  load(): void {
    const asked = this.changes;
    this.api
      .me()
      .pipe(catchError(() => of(null)))
      .subscribe((user) => {
        if (asked === this.changes) this.user.set(user);
      });
  }

  signIn(credentials: SignInCredentials): Observable<CurrentUser> {
    return this.api.signIn(credentials).pipe(tap((user) => this.set(user)));
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

  /** Forgets the person on this browser without asking the server. */
  clear(): void {
    this.set(null);
  }

  private set(user: CurrentUser | null): void {
    this.changes++;
    this.user.set(user);
  }
}
