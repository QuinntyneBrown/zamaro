import type { Locator, Page } from '@playwright/test';

/**
 * "Reject {name}’s application?" (docs/mocks/dialogs/reject-application): a required reason from
 * the fixed list, an optional note with a counter, and Reject application.
 */
export class RejectApplicationDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  heading(): Locator {
    return this.dialog().getByRole('heading', { level: 2 });
  }

  /** "A-0219 · Submitted · Fri 9 Oct". */
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
    return this.dialog().locator('.field__error');
  }

  note(): Locator {
    return this.dialog().getByRole('textbox', { name: /^Note to/ });
  }

  /** "0 / 1,000". */
  noteCounter(): Locator {
    return this.dialog().locator('.field__counter');
  }

  /** Chooses a reason by its label and types the note. */
  async fill(reason: string, note = ''): Promise<void> {
    await this.reason().selectOption({ label: reason });
    if (note) await this.note().fill(note);
  }

  /** Presses Reject application and waits for the API's answer. */
  async submit(): Promise<number> {
    const answered = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().endsWith('/rejection'),
    );
    await this.rejectButton().click();
    return (await answered).status();
  }

  /** "Reject application", "Rejecting…" or "Try again". */
  rejectButton(): Locator {
    return this.dialog()
      .locator('.dialog__footer')
      .getByRole('button', { name: /^(Reject application|Rejecting…|Try again)$/ });
  }

  cancelButton(): Locator {
    return this.dialog().locator('.dialog__footer').getByRole('button', { name: 'Cancel' });
  }

  closeButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Close' });
  }

  errorSummaryTitle(): Locator {
    return this.dialog().locator('.error-summary').getByRole('heading');
  }

  errorSummaryLinks(): Locator {
    return this.dialog().locator('.error-summary').getByRole('link');
  }

  alertTitle(): Locator {
    return this.dialog().getByRole('alert').locator('.alert__title');
  }
}
