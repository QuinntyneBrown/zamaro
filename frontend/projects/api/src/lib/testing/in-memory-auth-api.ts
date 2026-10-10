import { HttpErrorResponse } from '@angular/common/http';
import { type Observable, of, throwError } from 'rxjs';
import type { AuthApi } from '../auth/auth-api';
import type { CurrentUser, SignInCredentials } from '../models/accounts';

/** Naomi Fraser, the booker in docs/mocks/README.md. */
export const NAOMI: CurrentUser = {
  id: 1,
  name: 'Naomi Fraser',
  email: 'naomi.fraser@riversidecc.ca',
  initials: 'NF',
  roles: ['booker'],
  emailVerified: true,
  themePreference: null,
  termsAcceptanceRequired: false,
};

/** In-memory AuthApi for scenarios and component tests: one account and its password. */
export class InMemoryAuthApi implements AuthApi {
  private signedIn: CurrentUser | null = null;

  constructor(
    private readonly account: CurrentUser = NAOMI,
    private readonly password = 'hosanna-in-the-highest',
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

  me(): Observable<CurrentUser> {
    return this.signedIn
      ? of(this.signedIn)
      : throwError(() => new HttpErrorResponse({ status: 401 }));
  }
}
