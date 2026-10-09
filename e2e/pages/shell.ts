import type { Locator, Page } from '@playwright/test';

/** The header, skip link, main region and footer every zamaro page shares. */
export class Shell {
  constructor(private readonly page: Page) {}

  skipLink(): Locator {
    return this.page.getByRole('link', { name: 'Skip to content' });
  }

  primaryNavLinks(): Locator {
    return this.page.getByRole('navigation', { name: 'Primary' }).getByRole('link');
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
