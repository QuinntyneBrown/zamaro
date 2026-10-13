import { computed, Injectable, signal } from '@angular/core';

/**
 * "Email changed. You now sign in with {address}." under the top bar (docs/mocks/pages/confirm-email,
 * mock note): shown on the page an email change link returns to, then gone on the next page or when
 * dismissed.
 */
@Injectable({ providedIn: 'root' })
export class EmailChangedNotice {
  private readonly state = signal<{ email: string; shown: boolean } | null>(null);

  /** The new address, while the notice is on screen. */
  readonly email = computed(() => {
    const state = this.state();
    return state?.shown ? state.email : null;
  });

  /** Shows the notice on the next page. */
  show(email: string): void {
    this.state.set({ email, shown: false });
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
