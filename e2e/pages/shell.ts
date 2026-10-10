import type { Locator, Page } from '@playwright/test';
import { MenuDialog } from './menu.dialog';

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

  async hasHorizontalScroll(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  }
}
