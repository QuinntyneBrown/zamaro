import type { Locator, Page } from '@playwright/test';

/** "Weekly default" (docs/mocks/dialogs/weekly-default): a checkbox per weekday under "Unavailable every". */
export class WeeklyDefaultDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  heading(): Locator {
    return this.dialog().getByRole('heading', { level: 2 });
  }

  /** The checkbox for a weekday: "Tuesday". */
  weekday(name: string): Locator {
    return this.dialog().getByRole('checkbox', { name });
  }

  /** "Save weekly default", "Saving…" or "Try again". */
  actionButton(): Locator {
    return this.dialog()
      .locator('.dialog__footer')
      .getByRole('button', { name: /^(Save weekly default|Saving…|Try again)$/ });
  }

  cancelButton(): Locator {
    return this.dialog().locator('.dialog__footer').getByRole('button', { name: 'Cancel' });
  }

  /** Presses Save and waits for the API's answer. */
  async save(): Promise<number> {
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/artist/availability/weekly',
    );
    await this.actionButton().click();
    return (await answered).status();
  }

  /** The alert after a failed save: "Your weekly default wasn’t saved". */
  failedAlert(): Locator {
    return this.dialog().locator('.alert--danger');
  }
}
