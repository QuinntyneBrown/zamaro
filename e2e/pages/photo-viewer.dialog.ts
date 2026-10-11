import type { Locator, Page } from '@playwright/test';

/** The full-size photo viewer a profile photo opens (docs/mocks/dialogs/photo-viewer). */
export class PhotoViewerDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: /^Photo \d+ of \d+$/ });
  }

  title(): Locator {
    return this.dialog().locator('.dialog__title');
  }

  kicker(): Locator {
    return this.dialog().locator('.dialog__kicker');
  }

  /** The full-size photo, named by the artist's alt text. */
  photo(): Locator {
    return this.dialog().getByRole('img');
  }

  caption(): Locator {
    return this.dialog().locator('.dialog__body p');
  }

  previousButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Previous photo' });
  }

  nextButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Next photo' });
  }

  closeButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Close photo viewer' });
  }

  async next(): Promise<void> {
    await this.nextButton().click();
  }

  async previous(): Promise<void> {
    await this.previousButton().click();
  }

  async pressArrow(direction: 'left' | 'right'): Promise<void> {
    await this.page.keyboard.press(direction === 'left' ? 'ArrowLeft' : 'ArrowRight');
  }

  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
