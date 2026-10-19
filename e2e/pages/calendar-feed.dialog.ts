import type { Locator, Page } from '@playwright/test';

/**
 * "Subscribe in your calendar" (docs/mocks/dialogs/calendar-feed): turning the feed on, the secret
 * link with Copy link, and making a new link.
 */
export class CalendarFeedDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  heading(): Locator {
    return this.dialog().getByRole('heading', { level: 2 });
  }

  /** "Turn on calendar feed", "Turning on…", "Make a new link" (confirming) or "Try again". */
  actionButton(): Locator {
    return this.dialog()
      .locator('.dialog__footer')
      .getByRole('button', {
        name: /^(Turn on calendar feed|Turning on…|Make a new link|Try again)$/,
      });
  }

  /** "Cancel", "Done" or "Keep current link". */
  wayBackButton(): Locator {
    return this.dialog()
      .locator('.dialog__footer')
      .getByRole('button', { name: /^(Cancel|Done|Keep current link)$/ });
  }

  /** The read-only field holding the secret link. */
  link(): Locator {
    return this.dialog().getByRole('textbox', { name: 'Your secret calendar link' });
  }

  /** Lets the test write to and read the clipboard, as the Copy link button does. */
  async allowClipboard(): Promise<void> {
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  }

  async clipboardText(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText());
  }

  copyButton(): Locator {
    return this.dialog().getByRole('button', { name: /^(Copy link|Copied)$/ });
  }

  /** "Make a new link" in the body, which asks for confirmation. */
  makeNewLinkButton(): Locator {
    return this.dialog().locator('.dialog__body').getByRole('button', { name: 'Make a new link' });
  }

  failedAlert(): Locator {
    return this.dialog().locator('.alert--danger');
  }

  /** Presses the footer action and waits for the API's answer. */
  async act(): Promise<number> {
    const answered = this.page.waitForResponse((response) =>
      new URL(response.url()).pathname.startsWith('/api/v1/artist/calendar-feed'),
    );
    await this.actionButton().click();
    return (await answered).status();
  }
}
