import type { Locator, Page } from '@playwright/test';

/** The full-size photo viewer the profile's gallery opens (docs/mocks/dialogs/photo-viewer). */
export class PhotoViewerDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  title(): Locator {
    return this.dialog().locator('.dialog__title');
  }

  kicker(): Locator {
    return this.dialog().locator('.dialog__kicker');
  }

  image(): Locator {
    return this.dialog().locator('.dialog__body img');
  }

  closeButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Close photo viewer' });
  }

  previousButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Previous photo' });
  }

  nextButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Next photo' });
  }

  async next(): Promise<void> {
    await this.nextButton().click();
  }

  async previous(): Promise<void> {
    await this.previousButton().click();
  }

  async press(key: 'ArrowLeft' | 'ArrowRight' | 'Escape'): Promise<void> {
    await this.page.keyboard.press(key);
  }
}
