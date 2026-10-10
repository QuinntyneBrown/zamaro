import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable, switchMap } from 'rxjs';
import type { CurrentUser, SignInCredentials } from '../models/accounts';

/**
 * The session endpoints (accounts/sign-in-and-recover-access). Wrong credentials fail with 422 and
 * `errors.credentials`, whichever was wrong (L2-023.2).
 */
export interface AuthApi {
  signIn(credentials: SignInCredentials): Observable<CurrentUser>;
  /** Ends the session on the server; a session that already ended answers 401. */
  signOut(): Observable<void>;
  me(): Observable<CurrentUser>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AuthApi');

@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);

  /**
   * Fetches the CSRF cookie first: the API only accepts a state-changing request that repeats it in
   * `X-XSRF-TOKEN`, which Angular's XSRF interceptor adds (ADR-0015).
   */
  signIn(credentials: SignInCredentials): Observable<CurrentUser> {
    return this.http.get('/sanctum/csrf-cookie').pipe(
      switchMap(() => this.http.post<{ data: CurrentUser }>('/api/v1/session', credentials)),
      map((response) => response.data),
    );
  }

  signOut(): Observable<void> {
    return this.http.delete<void>('/api/v1/session');
  }

  me(): Observable<CurrentUser> {
    return this.http
      .get<{ data: CurrentUser }>('/api/v1/me')
      .pipe(map((response) => response.data));
  }
}
