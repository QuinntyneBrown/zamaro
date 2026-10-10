import { inject, Injectable, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';
import type { CurrentUser, SignInCredentials } from '../models/accounts';
import { AUTH_API } from './auth-api';

/** Who is signed in on this browser, as a signal, and the ways to change it. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AUTH_API);
  private readonly user = signal<CurrentUser | null>(null);

  /** The signed-in person, or null for a guest. */
  readonly currentUser = this.user.asReadonly();

  signIn(credentials: SignInCredentials): Observable<CurrentUser> {
    return this.api.signIn(credentials).pipe(tap((user) => this.user.set(user)));
  }
}
