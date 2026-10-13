import type { Locator, Page } from '@playwright/test';

const PROBLEM = { 'Content-Type': 'application/problem+json' };

/**
 * "Reject {name}’s application?" (docs/mocks/dialogs/reject-application): a required reason from the
 * fixed list, an optional note with its counter, then Reject application.
 */
export class RejectApplicationDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  heading(): Locator {
    return this.dialog().getByRole('heading', { level: 2 });
  }

  kicker(): Locator {
    return this.dialog().locator('.dialog__kicker');
  }

  description(): Locator {
    return this.dialog().locator('.dialog__description');
  }

  reason(): Locator {
    return this.dialog().getByRole('combobox', { name: /^Reason/ });
  }

  reasonError(): Locator {
    return this.dialog().locator('#reject-reason-error');
  }

  note(): Locator {
    return this.dialog().getByRole('textbox', { name: /^Note to/ });
  }

  /** "0 / 1,000". */
  noteCounter(): Locator {
    return this.dialog().locator('#reject-note-count');
  }

  errorSummary(): Locator {
    return this.dialog().locator('.error-summary');
  }

  errorSummaryTitle(): Locator {
    return this.errorSummary().locator('.error-summary__title');
  }

  errorSummaryItems(): Locator {
    return this.errorSummary().getByRole('link');
  }

  failedAlert(): Locator {
    return this.dialog()
      .getByRole('alert')
      .filter({ has: this.page.locator('.alert__title') });
  }

  failedTitle(): Locator {
    return this.failedAlert().locator('.alert__title');
  }

  cancelButton(): Locator {
    return this.dialog().locator('.dialog__footer').getByRole('button', { name: 'Cancel' });
  }

  /** "Reject application", "Rejecting…" or "Try again". */
  rejectButton(): Locator {
    return this.dialog()
      .locator('.dialog__footer')
      .getByRole('button', { name: /^(Reject application|Rejecting…|Try again)$/ });
  }

  /** Presses Reject application and waits for the API's answer. */
  async send(): Promise<number> {
    const answered = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().endsWith('/rejection'),
    );
    await this.rejectButton().click();
    return (await answered).status();
  }

  /** The next rejection fails on the server's side, once. */
  async failTheNextRejection(): Promise<void> {
    await this.page.route(
      (url) => url.pathname.endsWith('/rejection'),
      (route) =>
        route.fulfill({
          status: 500,
          headers: PROBLEM,
          body: JSON.stringify({
            type: 'about:blank',
            title: 'Something went wrong',
            status: 500,
            detail: 'The server could not complete the request.',
          }),
        }),
      { times: 1 },
    );
  }
}
