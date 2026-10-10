import type { Locator, Page } from '@playwright/test';

/** The navigation drawer the compact header's menu button opens (docs/mocks/dialogs/menu). */
export class MenuDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Menu' });
  }

  links(): Locator {
    return this.dialog().getByRole('navigation', { name: 'Main menu' }).getByRole('link');
  }

  themeToggle(): Locator {
    return this.dialog().getByRole('button', { name: 'Dark theme' });
  }

  async pressTab(times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.page.keyboard.press('Tab');
    }
  }

  async focusIsInside(): Promise<boolean> {
    return this.dialog().evaluate((dialog) => dialog.contains(document.activeElement));
  }

  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /** The longest animation on the drawer or anything inside it, in milliseconds. */
  async animationMs(): Promise<number> {
    return this.dialog().evaluate((dialog) =>
      Math.max(
        ...[dialog, ...dialog.querySelectorAll('*')].map(
          (element) => parseFloat(getComputedStyle(element).animationDuration) * 1000,
        ),
      ),
    );
  }
}
