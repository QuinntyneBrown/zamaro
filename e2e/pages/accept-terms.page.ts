import type { Locator, Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/** The terms gate at `/account/accept-terms` (docs/mocks/pages/accept-terms). */
export class AcceptTermsPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/account/accept-terms');
  }

  /** Presses Accept and continue and waits for the API's answer. */
  async accept(): Promise<void> {
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/account/consents/terms',
    );
    await this.acceptButton().click();
    await answered;
  }

  /** Accepting never answers. */
  async holdAccept(): Promise<void> {
    await this.page.route(
      '**/api/v1/account/consents/terms',
      () => new Promise<void>(() => undefined),
    );
  }

  /** Accepting fails on the server's side. */
  async failAccept(): Promise<void> {
    await this.page.route('**/api/v1/account/consents/terms', (route) =>
      route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/problem+json' },
        body: JSON.stringify({ title: 'Something went wrong', status: 500 }),
      }),
    );
  }

  /** The path and query in the address bar. */
  address(): string {
    const url = new URL(this.page.url());
    return `${url.pathname}${url.search}`;
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  lead(): Locator {
    return this.page.locator('.lead');
  }

  /** What changed, one item each. */
  changes(): Locator {
    return this.page.getByRole('main').locator('.changes li');
  }

  fullTermsLink(): Locator {
    return this.page.getByRole('link', { name: 'Full terms of use' });
  }

  acceptButton(): Locator {
    return this.page.getByRole('button', { name: /^(Accept and continue|Accepting…)$/ });
  }

  signOutButton(): Locator {
    return this.page.getByRole('main').getByRole('button', { name: 'Sign out' });
  }

  finePrint(): Locator {
    return this.page.locator('.stub__fine');
  }

  alertTitle(): Locator {
    return this.page.getByRole('alert').locator('.alert__title');
  }
}
