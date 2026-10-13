import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core';
import { AuthService, type CurrentUser, PREFERENCES_API } from 'api';

export type Theme = 'light' | 'dark';

/** Must match the inline boot script in index.html. */
const STORAGE_KEY = 'zamaro.theme';

/**
 * Light or dark (L2-104). With nothing stored the page follows the operating system through CSS; a
 * choice is kept on this device and, for someone signed in, on their account. When someone is known
 * to be signed in, the account's choice replaces the device's, or the device's is saved to an
 * account that has none. The inline boot script applies a stored choice before first paint, so on
 * the server this service does nothing. A failed save keeps the device's choice and says nothing
 * (D20); the next toggle or sign-in saves it again.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly auth = inject(AuthService);
  private readonly preferences = inject(PREFERENCES_API);
  /** The person whose account the device was last matched with. */
  private matchedWith: number | null = null;

  private readonly preference = signal<Theme | null>(this.readStored());
  private readonly system = signal<Theme>('light');

  readonly effective = computed<Theme>(() => this.preference() ?? this.system());
  readonly isDark = computed(() => this.effective() === 'dark');

  constructor() {
    if (!this.browser) {
      return;
    }
    const query = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
    if (query) {
      const update = () => this.system.set(query.matches ? 'dark' : 'light');
      update();
      query.addEventListener('change', update);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
    }
    effect(() => {
      const preference = this.preference();
      const root = this.document.documentElement;
      if (preference) {
        root.dataset['theme'] = preference;
      } else {
        delete root.dataset['theme'];
      }
    });
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => this.match(user));
    });
  }

  toggle(): void {
    const next: Theme = this.isDark() ? 'light' : 'dark';
    this.keep(next);
    if (this.auth.currentUser()) this.save(next);
  }

  /** On sign-in or start-up: the account's choice wins; a device choice fills an empty account. */
  private match(user: CurrentUser | null): void {
    if (user?.id === this.matchedWith) return;
    this.matchedWith = user?.id ?? null;
    if (!user) return;
    if (user.themePreference) {
      this.keep(user.themePreference);
    } else if (this.preference()) {
      this.save(this.preference()!);
    }
  }

  private keep(theme: Theme): void {
    this.preference.set(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
  }

  private save(theme: Theme): void {
    this.preferences.saveTheme(theme).subscribe({ error: () => undefined });
  }

  private readStored(): Theme | null {
    if (!this.browser) {
      return null;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  }
}
