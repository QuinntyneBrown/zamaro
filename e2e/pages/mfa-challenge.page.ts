import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/**
 * The code step of signing in, at `/account/sign-in/verify` (docs/mocks/pages/mfa-challenge): an
 * authenticator code, or a recovery code instead.
 */
export class MfaChallengePage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/account/sign-in/verify');
  }

  /** Waits until the sign-in page has handed over to this one. */
  async waitForIt(): Promise<void> {
    await expect(this.heading()).toHaveText('Enter your code');
  }

  /** Enters a code (or recovery code) and presses Verify and continue, waiting for the answer. */
  async verify(code: string): Promise<void> {
    await this.field().fill(code);
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/session/two-factor',
    );
    await this.verifyButton().click();
    await answered;
  }

  async useRecoveryCode(): Promise<void> {
    await this.page.getByRole('link', { name: 'Use a recovery code instead' }).click();
  }

  path(): string {
    return new URL(this.page.url()).pathname;
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "6-digit code", or "Recovery code" once switched. */
  field(): Locator {
    return this.page.getByRole('textbox', { name: /^(6-digit code|Recovery code)/ });
  }

  /** "Signing in as …" or "Eight letters and numbers…". */
  fieldHelp(): Locator {
    return this.page.locator('.field__help');
  }

  fieldError(): Locator {
    return this.page.locator('.field__error');
  }

  verifyButton(): Locator {
    return this.page.getByRole('button', { name: /^(Verify and continue|Checking…)$/ });
  }

  errorSummaryTitle(): Locator {
    return this.page.locator('.error-summary').getByRole('heading');
  }

  errorSummaryLinks(): Locator {
    return this.page.locator('.error-summary').getByRole('link');
  }

  alertTitle(): Locator {
    return this.page.getByRole('alert').locator('.alert__title');
  }

  alertText(): Locator {
    return this.page.getByRole('alert').locator('p').nth(1);
  }

  lead(): Locator {
    return this.page.locator('p.text-muted');
  }
}
