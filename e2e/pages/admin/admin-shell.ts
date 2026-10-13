import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { AccountMenuDialog } from '../account-menu.dialog';
import { Shell } from '../shell';
import { AdminMenuDialog } from './admin-menu.dialog';

/**
 * The admin workspace around every admin screen (docs/mocks/pages/admin-*): the workspace top bar
 * with its role tag and section links, the main region and the admin footer. The public shell's
 * landmarks and controls apply here too.
 */
export class AdminShell {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens an admin address and answers the HTTP status of the document. */
  async open(path: string): Promise<number> {
    await freezeClock(this.page);
    const response = await this.page.goto(path, { waitUntil: 'networkidle' });
    return response?.status() ?? 0;
  }

  /** The path in the address bar. */
  path(): string {
    return new URL(this.page.url()).pathname;
  }

  /** "Admin": the tag after the brand on the workspace bar. */
  roleTag(): Locator {
    return this.page.getByRole('banner').locator('.topbar__role');
  }

  /** The section links in the bar, in order; below XL they live in the drawer instead. */
  sectionLinks(): Locator {
    return this.shell.primaryNavLinks();
  }

  async openSection(name: string): Promise<void> {
    await this.shell.followNavLink(name);
  }

  async openMenu(): Promise<AdminMenuDialog> {
    await this.shell.menuButton().click();
    return new AdminMenuDialog(this.page);
  }

  async openAccountMenu(): Promise<AccountMenuDialog> {
    await this.shell.accountButton().click();
    return new AccountMenuDialog(this.page);
  }

  /** The avatar's initials, "PN". */
  avatarInitials(): Locator {
    return this.shell.accountButton().locator('.avatar__initials, .avatar');
  }

  /** The page's level-one heading. */
  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The footer's headings and columns are the public shell's; the last column names the administrator. */
  footerHeadings(): Locator {
    return this.shell.footerHeadings();
  }

  footerColumn(heading: string): Locator {
    return this.shell.footerColumn(heading);
  }

  /** Waits until the browser has taken over and knows who is signed in. */
  async waitForAdministrator(): Promise<void> {
    await expect(this.shell.accountButton()).toBeVisible();
  }
}
