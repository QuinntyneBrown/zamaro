import type { Locator, Page } from '@playwright/test';
import { Toast } from '../toasts';

/**
 * The idle-session warning (docs/mocks/notifications/session-toast/warning): "Heads up · You'll be
 * signed out in 2 minutes." with "Stay signed in", shown 28 minutes after the last admin request and
 * never leaving on its own (L2-066.3).
 */
export class SessionToast extends Toast {
  constructor(private readonly page: Page) {
    super(
      page
        .locator('.toast-region .toast')
        .filter({ has: page.locator('.toast__title', { hasText: 'signed out' }) }),
    );
  }

  stayButton(): Locator {
    return this.root.getByRole('button', { name: 'Stay signed in' });
  }

  /** Presses Stay signed in and waits for the activity request it makes. */
  async staySignedIn(): Promise<number> {
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/admin/overview',
    );
    await this.stayButton().click();
    return (await answered).status();
  }
}
