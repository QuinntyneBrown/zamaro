import type { Locator, Page } from '@playwright/test';

/** The account menu the avatar opens (docs/mocks/dialogs/account-menu): who is signed in, links, Sign out. */
export class AccountMenuDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: /^Account menu for/ });
  }

  /** The name, church and email above the list, which is also the dialog's description. */
  who(): Locator {
    return this.dialog().locator('.menu__who');
  }

  whoName(): Locator {
    return this.who().locator('strong');
  }

  /** Every link and button in the list, in Tab order. */
  items(): Locator {
    return this.dialog().locator('.menu__item');
  }

  link(name: string): Locator {
    return this.dialog().getByRole('link', { name });
  }

  signOutButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Sign out' });
  }

  async signOut(): Promise<void> {
    await this.signOutButton().click();
  }

  async pressTab(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }

  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
