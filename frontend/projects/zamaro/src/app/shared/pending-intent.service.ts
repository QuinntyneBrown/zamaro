import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

/** A Save a guest pressed before signing in (accounts/save-artist). */
export interface PendingSave {
  kind: 'save-artist';
  artistId: number;
  /** For the "Saved {name}" toast once it is replayed. */
  name: string;
  pronoun: 'she' | 'he' | 'they';
  returnUrl: string;
}

const KEY = 'zamaro.pending-intent';

/**
 * Holds one action a guest started, in this tab's `sessionStorage` only, until a sign-in replays it
 * (L2-026.3). A newer intent replaces an older one. Storage that is unavailable holds nothing.
 */
@Injectable({ providedIn: 'root' })
export class PendingIntentService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  hold(intent: PendingSave): void {
    if (!this.browser) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(intent));
    } catch {
      // Private browsing or blocked storage: the guest saves again after signing in.
    }
  }

  /** The held intent, removed as it is read. */
  take(): PendingSave | null {
    if (!this.browser) return null;
    try {
      const held = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
      const intent = held ? (JSON.parse(held) as Partial<PendingSave>) : null;
      return intent?.kind === 'save-artist' && typeof intent.artistId === 'number'
        ? (intent as PendingSave)
        : null;
    } catch {
      return null;
    }
  }
}
