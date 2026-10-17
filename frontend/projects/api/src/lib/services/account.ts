import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable, switchMap } from 'rxjs';
import type {
  AccountSession,
  Church,
  ChurchDetails,
  CurrentUser,
  PasswordChange,
  TwoFactorKey,
} from '../models/accounts';

/**
 * Account settings (accounts/manage-account-settings, accounts/manage-church-profile): the account
 * name, a booker's church and an artist's private contact phone.
 */
export interface AccountApi {
  /** Renames the account; the answer is the person as `/me` gives them. */
  updateProfile(name: string): Observable<CurrentUser>;
  /** The booker's church, or null until they save one. */
  church(): Observable<Church | null>;
  /**
   * Saves the church. An address that cannot be found is a 422 on `streetAddress`, one outside the
   * service area a 422 on `serviceArea`, and nothing is stored.
   */
  saveChurch(church: ChurchDetails): Observable<Church>;
  /** The artist's contact phone, "905-555-0148", or null. */
  contactPhone(): Observable<string | null>;
  saveContactPhone(contactPhone: string): Observable<string | null>;
  /**
   * Asks for a new account email, confirmed with the current password; answers the new address. The
   * answer is the same when another account uses it. A wrong password is a 422 on `currentPassword`.
   */
  requestEmailChange(email: string, currentPassword: string): Observable<string>;
  /** Opens an email change link; answers the address the account now signs in with. 410 when spent. */
  confirmEmailChange(token: string): Observable<string>;
  /** A new password: every other session ends and this one gets a new ID (L2-025.2). */
  changePassword(change: PasswordChange): Observable<void>;
  /** The signed-in devices: this one first, then the most recently active (L2-025.3). */
  sessions(): Observable<AccountSession[]>;
  /** Signs that device out at once. */
  endSession(id: string): Observable<void>;
  /** A new key for an authenticator app; nothing changes until a code confirms it (L2-072.3). */
  beginTwoFactor(): Observable<TwoFactorKey>;
  /** The first code turns two-step sign-in on; answers the 10 recovery codes, once. */
  confirmTwoFactor(code: string): Observable<string[]>;
  /** Needs a current code or an unused recovery code (L2-072.5). */
  turnOffTwoFactor(code: string): Observable<void>;
  /** Needs a current code or an unused recovery code; 10 new codes replace every earlier one. */
  newRecoveryCodes(code: string): Observable<string[]>;
}

export const ACCOUNT_API = new InjectionToken<AccountApi>('AccountApi');

@Injectable()
export class HttpAccountApi implements AccountApi {
  private readonly http = inject(HttpClient);

  updateProfile(name: string): Observable<CurrentUser> {
    return this.http
      .put<{ data: CurrentUser }>('/api/v1/account/profile', { name })
      .pipe(map((response) => response.data));
  }

  church(): Observable<Church | null> {
    return this.http
      .get<{ data: Church | null }>('/api/v1/account/church')
      .pipe(map((response) => response.data));
  }

  saveChurch(church: ChurchDetails): Observable<Church> {
    return this.http
      .put<{ data: Church }>('/api/v1/account/church', church)
      .pipe(map((response) => response.data));
  }

  contactPhone(): Observable<string | null> {
    return this.http
      .get<{ data: { contactPhone: string | null } }>('/api/v1/account/contact-phone')
      .pipe(map((response) => response.data.contactPhone));
  }

  requestEmailChange(email: string, currentPassword: string): Observable<string> {
    return this.http
      .put<{ data: { email: string } }>('/api/v1/account/email', { email, currentPassword })
      .pipe(map((response) => response.data.email));
  }

  /** The link is often opened in another browser, so the CSRF cookie is fetched first. */
  confirmEmailChange(token: string): Observable<string> {
    return this.http.get('/api/v1/csrf-cookie').pipe(
      switchMap(() =>
        this.http.post<{ data: { email: string } }>('/api/v1/account/email/confirm', { token }),
      ),
      map((response) => response.data.email),
    );
  }

  changePassword(change: PasswordChange): Observable<void> {
    return this.http.put('/api/v1/account/password', change).pipe(map(() => undefined));
  }

  sessions(): Observable<AccountSession[]> {
    return this.http
      .get<{ data: AccountSession[] }>('/api/v1/account/sessions')
      .pipe(map((response) => response.data));
  }

  beginTwoFactor(): Observable<TwoFactorKey> {
    return this.http
      .post<{ data: TwoFactorKey }>('/api/v1/account/two-factor', {})
      .pipe(map((response) => response.data));
  }

  confirmTwoFactor(code: string): Observable<string[]> {
    return this.http
      .post<{
        data: { recoveryCodes: string[] };
      }>('/api/v1/account/two-factor/confirm', { code })
      .pipe(map((response) => response.data.recoveryCodes));
  }

  turnOffTwoFactor(code: string): Observable<void> {
    return this.http
      .delete('/api/v1/account/two-factor', { body: { code } })
      .pipe(map(() => undefined));
  }

  newRecoveryCodes(code: string): Observable<string[]> {
    return this.http
      .post<{
        data: { recoveryCodes: string[] };
      }>('/api/v1/account/two-factor/recovery-codes', { code })
      .pipe(map((response) => response.data.recoveryCodes));
  }

  endSession(id: string): Observable<void> {
    return this.http
      .delete(`/api/v1/account/sessions/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }

  saveContactPhone(contactPhone: string): Observable<string | null> {
    return this.http
      .put<{ data: { contactPhone: string | null } }>('/api/v1/account/contact-phone', {
        contactPhone,
      })
      .pipe(map((response) => response.data.contactPhone));
  }
}
