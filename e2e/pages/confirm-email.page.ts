import type { Locator, Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/**
 * The email change link's page at `/account/email/confirm` (docs/mocks/pages/confirm-email):
 * "Confirming your new email", then account settings, or "This link has expired".
 */
export class ConfirmEmailPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens a link from an email, which names the e2e site, and waits for the API's answer. */
  async openLink(link: string): Promise<void> {
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/account/email/confirm',
    );
    await this.startLink(link);
    await answered;
  }

  /** Opens a link without waiting for the API, which may never answer. */
  async startLink(link: string): Promise<void> {
    await freezeClock(this.page);
    const { pathname, search } = new URL(link);
    await this.page.goto(`${pathname}${search}`);
  }

  /** Confirming never answers, so the card keeps confirming. */
  async holdConfirm(): Promise<void> {
    await this.page.route(
      '**/api/v1/account/email/confirm',
      () => new Promise<void>(() => undefined),
    );
  }

  /** Confirming fails on the server's side until `restoreConfirm()`. */
  async failConfirm(): Promise<void> {
    await this.page.route('**/api/v1/account/email/confirm', (route) =>
      route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/problem+json' },
        body: JSON.stringify({ title: 'Something went wrong', status: 500 }),
      }),
    );
  }

  async restoreConfirm(): Promise<void> {
    await this.page.unroute('**/api/v1/account/email/confirm');
  }

  path(): string {
    return new URL(this.page.url()).pathname;
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  // "Confirming your new email" (default and error)

  confirmingCard(): Locator {
    return this.page.getByRole('region', { name: 'Confirming your new email' });
  }

  /** "Switching your sign-in to {new address}…". */
  confirmingStatus(): Locator {
    return this.confirmingCard().getByRole('status');
  }

  alertTitle(): Locator {
    return this.confirmingCard().getByRole('alert').locator('.alert__title');
  }

  tryAgainButton(): Locator {
    return this.confirmingCard().getByRole('button', { name: 'Try again' });
  }

  async tryAgain(): Promise<void> {
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/account/email/confirm',
    );
    await this.tryAgainButton().click();
    await answered;
  }

  backToAccountLink(): Locator {
    return this.confirmingCard().getByRole('link', { name: 'Back to account settings' });
  }

  // "This link has expired" (expired)

  expiredCard(): Locator {
    return this.page.getByRole('region', { name: 'This link has expired' });
  }

  stamp(): Locator {
    return this.expiredCard().locator('.stamp');
  }

  expiredText(): Locator {
    return this.expiredCard()
      .locator('p')
      .filter({ hasText: /^Nothing changed/ });
  }

  changeAgainLink(): Locator {
    return this.expiredCard().getByRole('link', { name: 'Change email again' });
  }
}
