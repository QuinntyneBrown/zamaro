import type { Locator, Page } from '@playwright/test';
import { MenuDialog } from '../menu.dialog';

/** The admin drawer below XL (docs/mocks/dialogs/menu/admin): the sections with their counts, then the theme toggle. */
export class AdminMenuDialog extends MenuDialog {
  constructor(private readonly adminPage: Page) {
    super(adminPage);
  }

  /** "Your account stays in the top bar." */
  description(): Locator {
    return this.dialog().locator('p.text-muted');
  }

  /** The focused element's accessible name, once the drawer has closed. */
  focusedName(): Promise<string | null> {
    return this.adminPage.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? null,
    );
  }
}
