import type { Locator, Page } from '@playwright/test';

/**
 * "Mark dates unavailable" (docs/mocks/dialogs/block-dates): a start date, an end date and a
 * private note; a warning when a church has asked about a date in the range.
 */
export class BlockDatesDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  heading(): Locator {
    return this.dialog().getByRole('heading', { level: 2 });
  }

  startDate(): Locator {
    return this.dialog().getByLabel(/^Start date/);
  }

  endDate(): Locator {
    return this.dialog().getByLabel(/^End date/);
  }

  note(): Locator {
    return this.dialog().getByLabel(/^Note/);
  }

  /** "2 days: Thu 26 and Fri 27 Nov. No church has asked about these dates. …" */
  summary(): Locator {
    return this.dialog().locator('.block-dates__summary');
  }

  /** Fills the range and the note. */
  async fill(from: string, to: string, note = ''): Promise<void> {
    await this.startDate().fill(from);
    await this.endDate().fill(to);
    if (note) await this.note().fill(note);
  }

  /** "Mark 2 days unavailable", "Saving…", "Try again" or "Mark unavailable and decline". */
  actionButton(): Locator {
    return this.dialog()
      .locator('.dialog__footer')
      .getByRole('button', {
        name: /^(Mark .* unavailable|Saving…|Try again|Mark unavailable and decline)$/,
      });
  }

  /** "Cancel" or "Keep {date} open": the way back. */
  wayBackButton(): Locator {
    return this.dialog()
      .locator('.dialog__footer')
      .getByRole('button', { name: /^(Cancel|Keep .* open)$/ });
  }

  /** Presses the action and waits for the API's answer. */
  async save(): Promise<number> {
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/artist/availability/dates',
    );
    await this.actionButton().click();
    return (await answered).status();
  }

  /** The warning that a church has asked about a date in the range. */
  warning(): Locator {
    return this.dialog().getByRole('alert');
  }

  /** The error summary when the dates do not make a range. */
  errorSummary(): Locator {
    return this.dialog().locator('.error-summary');
  }

  fieldError(): Locator {
    return this.dialog().locator('.field__error');
  }

  /** The alert after a failed save: "Those dates weren’t saved". */
  failedAlert(): Locator {
    return this.dialog().locator('.alert--danger');
  }
}
