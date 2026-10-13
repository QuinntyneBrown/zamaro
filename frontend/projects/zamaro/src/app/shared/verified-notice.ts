import { computed, Injectable, signal } from '@angular/core';

/**
 * "Email verified" under the top bar (docs/mocks/notifications/system-banner/success): shown on the
 * page a verification link returns to, then gone on the next page or when dismissed.
 */
@Injectable({ providedIn: 'root' })
export class VerifiedNotice {
  private readonly state = signal<{ name: string; shown: boolean } | null>(null);

  /** The first name to thank, while the notice is on screen. */
  readonly name = computed(() => {
    const state = this.state();
    return state?.shown ? state.name : null;
  });

  /** Thanks `name` on the next page. */
  show(name: string): void {
    this.state.set({ name: name.trim().split(/\s+/)[0], shown: false });
  }

  /** The shell calls it after every navigation: the notice lasts one page. */
  pageChanged(): void {
    const state = this.state();
    if (state) this.state.set(state.shown ? null : { ...state, shown: true });
  }

  dismiss(): void {
    this.state.set(null);
  }
}
