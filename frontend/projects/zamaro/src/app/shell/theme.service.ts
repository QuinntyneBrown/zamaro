import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';

export type Theme = 'light' | 'dark';

/** Must match the inline boot script in index.html. */
const STORAGE_KEY = 'zamaro.theme';

/**
 * Light or dark (L2-104). With nothing stored the page follows the operating system through CSS; a
 * choice is kept on this device. The inline boot script applies a stored choice before first paint,
 * so on the server this service does nothing.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

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
  }

  toggle(): void {
    const next: Theme = this.isDark() ? 'light' : 'dark';
    this.preference.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
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
