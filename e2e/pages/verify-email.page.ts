import type { Locator, Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/**
 * The verification link's page at `/verify-email` (docs/mocks/pages/verify-email): "Checking your
 * link", then the page it returns to, or "This link has expired" with "Send a new link".
 */
export class VerifyEmailPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens a link from an email, which names the e2e site. */
  async openLink(link: string): Promise<void> {
    await freezeClock(this.page);
    const { pathname, search } = new URL(link);
    await this.page.goto(`${pathname}${search}`);
  }

  async openToken(token: string): Promise<void> {
    await this.openLink(`http://localhost:4000/verify-email?token=${token}&returnUrl=%2F`);
  }

  /** The check never answers, so the card keeps checking. */
  async holdCheck(): Promise<void> {
    await this.page.route('**/api/v1/email/verify', () => new Promise<void>(() => undefined));
  }

  /** The check fails on the server's side until `restoreCheck()`. */
  async failCheck(): Promise<void> {
    await this.page.route('**/api/v1/email/verify', (route) =>
      route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/problem+json' },
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Something went wrong',
          status: 500,
          detail: 'The server could not complete the request.',
        }),
      }),
    );
  }

  async restoreCheck(): Promise<void> {
    await this.page.unroute('**/api/v1/email/verify');
  }

  /** The path in the address bar. */
  path(): string {
    return new URL(this.page.url()).pathname;
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  // "Checking your link" (docs/mocks/pages/verify-email/default and error)

  checkingCard(): Locator {
    return this.page.getByRole('region', { name: 'Checking your link' });
  }

  /** "Confirming naomi.fraser@riversidecc.ca…", or "Confirming your email…" for a guest. */
  checkingStatus(): Locator {
    return this.checkingCard().getByRole('status');
  }

  alert(): Locator {
    return this.checkingCard().getByRole('alert');
  }

  alertTitle(): Locator {
    return this.alert().locator('.alert__title');
  }

  alertText(): Locator {
    return this.alert().locator('p').nth(1);
  }

  tryAgainButton(): Locator {
    return this.checkingCard().getByRole('button', { name: 'Try again' });
  }

  async tryAgain(): Promise<void> {
    await this.tryAgainButton().click();
  }

  // "This link has expired" (docs/mocks/pages/verify-email/expired)

  expiredCard(): Locator {
    return this.page.getByRole('region', { name: 'This link has expired' });
  }

  stamp(): Locator {
    return this.expiredCard().locator('.stamp');
  }

  expiredText(): Locator {
    return this.expiredCard().getByText('Verification links work once, for 24 hours.');
  }

  /** "Send a new link", then "Sent". */
  sendNewLinkButton(): Locator {
    return this.expiredCard().getByRole('button', { name: /^(Send a new link|Sent)$/ });
  }

  async sendNewLink(): Promise<void> {
    await this.sendNewLinkButton().click();
  }

  /** "A new link is on its way…", once sent. */
  sentStatus(): Locator {
    return this.expiredCard().getByRole('status');
  }

  keepBrowsingLink(): Locator {
    return this.page.getByRole('main').getByRole('link', { name: 'Keep browsing artists' });
  }

  finePrint(): Locator {
    return this.expiredCard().locator('.stub__fine');
  }
}
