import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { CurrentUser } from '../models/accounts';

/** The signed-in person's preferences (user-experience/switch-theme, L2-104.2). */
export interface PreferencesApi {
  /** Saves the theme to the account; null follows each device again. Answers the person. */
  saveTheme(theme: 'light' | 'dark' | null): Observable<CurrentUser>;
}

export const PREFERENCES_API = new InjectionToken<PreferencesApi>('PreferencesApi');

@Injectable()
export class HttpPreferencesApi implements PreferencesApi {
  private readonly http = inject(HttpClient);

  saveTheme(theme: 'light' | 'dark' | null): Observable<CurrentUser> {
    return this.http
      .patch<{ data: CurrentUser }>('/api/v1/me/preferences', { themePreference: theme })
      .pipe(map((response) => response.data));
  }
}
