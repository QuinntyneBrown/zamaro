import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { Church, ChurchDetails, CurrentUser } from '../models/accounts';

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

  saveContactPhone(contactPhone: string): Observable<string | null> {
    return this.http
      .put<{ data: { contactPhone: string | null } }>('/api/v1/account/contact-phone', {
        contactPhone,
      })
      .pipe(map((response) => response.data.contactPhone));
  }
}
