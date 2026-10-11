import type { Locator, Page } from '@playwright/test';
import { AccountMenuDialog } from './account-menu.dialog';
import { MenuDialog } from './menu.dialog';
import { readHead, type PageHead } from './page-head';

export type Theme = 'light' | 'dark';

/** The header, skip link, main region and footer every zamaro page shares. */
export class Shell {
  constructor(private readonly page: Page) {}

  skipLink(): Locator {
    return this.page.getByRole('link', { name: 'Skip to content' });
  }

  primaryNav(): Locator {
    return this.page.getByRole('navigation', { name: 'Primary' });
  }

  primaryNavLinks(): Locator {
    return this.primaryNav().getByRole('link');
  }

  /** Follows a header link such as "How booking works". */
  async followNavLink(name: string): Promise<void> {
    await this.primaryNav().getByRole('link', { name }).click();
  }

  menuButton(): Locator {
    return this.page.getByRole('banner').getByRole('button', { name: 'Open menu' });
  }

  /** The header's theme toggle (shown from LG); below LG it is an item in the menu. */
  themeToggle(): Locator {
    return this.page.getByRole('banner').getByRole('button', { name: 'Dark theme' });
  }

  async openMenu(): Promise<MenuDialog> {
    await this.menuButton().click();
    return new MenuDialog(this.page);
  }

  /** The avatar that opens the account menu: "Account menu for Naomi Fraser". */
  accountButton(): Locator {
    // Found while the account menu hides the rest of the page from assistive technology, too.
    return this.page
      .getByRole('banner', { includeHidden: true })
      .getByRole('button', { name: /^Account menu for/, includeHidden: true });
  }

  /** The header's Saved link, named "Saved 3 artists" with its count (L2-026). */
  savedLink(): Locator {
    return this.page.getByRole('banner').locator('.topbar__saved');
  }

  /** The header's link for someone signed out. */
  signInLink(): Locator {
    return this.page.getByRole('banner').getByRole('link', { name: 'Sign in' });
  }

  /** The sign-in page's header link: "Create account", "Sign up" below 480 px. */
  createAccountLink(): Locator {
    return this.page.getByRole('banner').getByRole('link', { name: /^(Create account|Sign up)/ });
  }

  async openAccountMenu(): Promise<AccountMenuDialog> {
    await this.accountButton().click();
    return new AccountMenuDialog(this.page);
  }

  async signInFromHeader(): Promise<void> {
    await this.signInLink().click();
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle().click();
  }

  /** The colour scheme the page is painted in. */
  async paintedTheme(): Promise<Theme> {
    return this.page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme.trim() as Theme,
    );
  }

  async scrollBehavior(): Promise<string> {
    return this.page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  }

  main(): Locator {
    return this.page.getByRole('main');
  }

  footer(): Locator {
    return this.page.getByRole('contentinfo');
  }

  /** The footer's column headings, in order: "Churches", "Artists", "Your account". */
  footerHeadings(): Locator {
    return this.footer().getByRole('heading', { level: 2 });
  }

  /** The entries under one footer heading. */
  footerColumn(heading: string): Locator {
    return this.footer()
      .getByRole('heading', { name: heading, exact: true })
      .locator('xpath=following-sibling::ul[1]')
      .getByRole('listitem');
  }

  /** The entries of the footer's last column: "Your account", or the signed-in person's. */
  accountFooterColumn(): Locator {
    return this.footer().locator('ul').last().getByRole('listitem');
  }

  /** How many of each landmark and level-one heading the page renders. */
  async landmarkCounts(): Promise<Record<'banner' | 'main' | 'contentinfo' | 'h1', number>> {
    return {
      banner: await this.page.getByRole('banner').count(),
      main: await this.main().count(),
      contentinfo: await this.footer().count(),
      h1: await this.page.getByRole('heading', { level: 1 }).count(),
    };
  }

  async pressTab(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }

  async useSkipLink(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  async useWidth(width: number): Promise<void> {
    await this.page.setViewportSize({ width, height: 800 });
  }

  /** Paints the page as a device set to `theme` would, with nothing stored on it. */
  async useSystemTheme(theme: Theme): Promise<void> {
    await this.page.emulateMedia({ colorScheme: theme });
  }

  /** Follows the page's link to `path`, so the next page is rendered in the browser. */
  async followLinkTo(path: string): Promise<void> {
    await this.page.locator(`a[href="${path}"]`).first().click();
  }

  /** Loads every image now, lazy or not, and waits for the images and web fonts to be ready. */
  async settle(): Promise<void> {
    await this.page.evaluate(async () => {
      const images = [...document.images];
      images.forEach((image) => (image.loading = 'eager'));
      await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
      await document.fonts.ready;
    });
  }

  /** How far the page is scrolled down, in CSS pixels. */
  async scrollTop(): Promise<number> {
    return this.page.evaluate(() => Math.round(window.scrollY));
  }

  async hasHorizontalScroll(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  }

  /** The HTML the server renders for `path` with this browser's cookies, before any script runs. */
  async serverRenderedHtml(path: string): Promise<string> {
    const response = await this.page.request.get(path);
    return response.text();
  }

  /** The live document's head, as it stands after the browser took over. */
  async head(): Promise<PageHead> {
    return readHead(this.page);
  }

  // Toasts (docs/specs/components/toast.md)

  /** The one polite status region every page ends with. */
  toastRegion(): Locator {
    return this.page.locator('.toast-region');
  }

  toasts(): Locator {
    return this.toastRegion().locator('.toast');
  }

  /** A toast found by its title, such as "Link copied". */
  toast(title: string): Toast {
    return new Toast(
      this.toasts().filter({ has: this.page.locator('.toast__title', { hasText: title }) }),
    );
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  // Banners under the top bar (docs/specs/components/alert.md)

  banners(): Locator {
    return this.page.locator('.banner');
  }

  /** A banner found by its label, such as "Verify your email". */
  banner(label: string): Banner {
    return new Banner(
      this.banners().filter({ has: this.page.locator('.banner__text strong', { hasText: label }) }),
    );
  }
}

/** One banner: its label, the sentence after it, the inline action and the close button. */
export class Banner {
  constructor(readonly root: Locator) {}

  label(): Locator {
    return this.root.locator('.banner__text strong');
  }

  /** The label, the sentence and the action's name, as one line. */
  text(): Locator {
    return this.root.locator('.banner__text');
  }

  action(): Locator {
    return this.root.locator('.banner__action');
  }

  closeButton(): Locator {
    return this.root.getByRole('button', { name: /^Dismiss/ });
  }

  async pressAction(): Promise<void> {
    await this.action().click();
  }

  async dismiss(): Promise<void> {
    await this.closeButton().click();
  }
}

/** One toast slip: kind, title, text and its dismiss button. */
export class Toast {
  constructor(readonly root: Locator) {}

  kind(): Locator {
    return this.root.locator('.toast__kind');
  }

  title(): Locator {
    return this.root.locator('.toast__title');
  }

  text(): Locator {
    return this.root.locator('.toast__text');
  }

  dismissButton(): Locator {
    return this.root.getByRole('button', { name: /^Dismiss/ });
  }

  async dismiss(): Promise<void> {
    await this.dismissButton().click();
  }

  async hover(): Promise<void> {
    await this.root.hover();
  }
}
