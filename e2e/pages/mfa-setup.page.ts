import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/**
 * Turn on two-step sign-in at `/account/security/mfa` (docs/mocks/pages/mfa-setup): the QR code and
 * key, the 6-digit code, then "Save your recovery codes".
 */
export class MfaSetupPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens the page and waits for the key. */
  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/account/security/mfa');
    await expect(this.key()).toBeVisible();
  }

  /** Enters a code and presses Turn on, waiting for the API's answer. */
  async turnOn(code: string): Promise<void> {
    await this.code().fill(code);
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/account/two-factor/confirm',
    );
    await this.turnOnButton().click();
    await answered;
  }

  /** Turning on never answers. */
  async holdConfirm(): Promise<void> {
    await this.page.route(
      '**/api/v1/account/two-factor/confirm',
      () => new Promise<void>(() => undefined),
    );
  }

  /** Turning on fails on the server's side. */
  async failConfirm(): Promise<void> {
    await this.page.route('**/api/v1/account/two-factor/confirm', (route) =>
      route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/problem+json' },
        body: JSON.stringify({ title: 'Something went wrong', status: 500 }),
      }),
    );
  }

  path(): string {
    const url = new URL(this.page.url());
    return `${url.pathname}${url.hash}`;
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The key to type into an authenticator app, in groups of four: "JBSW Y3DP …". */
  key(): Locator {
    return this.page.getByRole('main').locator('code');
  }

  qrCode(): Locator {
    return this.page.getByRole('img', { name: /^QR code that adds Zamaro/ });
  }

  code(): Locator {
    return this.page.getByRole('textbox', { name: /^6-digit code/ });
  }

  turnOnButton(): Locator {
    return this.page.getByRole('button', { name: /^(Turn on|Checking…)$/ });
  }

  cancelLink(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and keep it off' });
  }

  errorSummaryTitle(): Locator {
    return this.page.locator('.error-summary').getByRole('heading');
  }

  errorSummaryLinks(): Locator {
    return this.page.locator('.error-summary').getByRole('link');
  }

  codeError(): Locator {
    return this.page.locator('.field__error');
  }

  alertTitle(): Locator {
    return this.page.getByRole('alert').locator('.alert__title');
  }

  // "Save your recovery codes" (docs/mocks/pages/mfa-setup/codes)

  recoveryCodes(): Locator {
    return this.page.getByRole('list', { name: '10 recovery codes' }).locator('code');
  }

  copyButton(): Locator {
    return this.page.getByRole('button', { name: /^(Copy codes|Copied)$/ });
  }

  downloadButton(): Locator {
    return this.page.getByRole('button', { name: 'Download codes' });
  }

  savedThemLink(): Locator {
    return this.page.getByRole('link', { name: 'I’ve saved them' });
  }

  finePrint(): Locator {
    return this.page.locator('.stub__fine');
  }
}
