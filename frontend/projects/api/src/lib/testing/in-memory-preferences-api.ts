import { type Observable, of } from 'rxjs';
import type { CurrentUser } from '../models/accounts';
import type { PreferencesApi } from '../services/preferences';

/** In-memory PreferencesApi: answers the person it was given with the theme saved. */
export class InMemoryPreferencesApi implements PreferencesApi {
  constructor(private user: CurrentUser) {}

  saveTheme(theme: 'light' | 'dark' | null): Observable<CurrentUser> {
    this.user = { ...this.user, themePreference: theme };
    return of(this.user);
  }
}
