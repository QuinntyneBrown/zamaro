import type { Locator, Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/**
 * The artist workspace under `/artist` (docs/mocks/pages/dashboard): its header for an artist, and
 * the "This page is for artists" body that stands in for it for anyone else (L2-074).
 */
export class ArtistWorkspacePage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens `/artist` and waits for the page to settle. */
  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/artist', { waitUntil: 'networkidle' });
  }

  /** The path and query in the address bar. */
  location(): string {
    const url = new URL(this.page.url());
    return `${url.pathname}${url.search}`;
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The sentence under the heading: who is signed in and what the page is for. */
  explanation(): Locator {
    return this.main().locator('p').filter({ hasText: 'You’re signed in as' });
  }

  backToDiscoverLink(): Locator {
    return this.main().getByRole('link', { name: 'Back to Discover' });
  }

  applyLink(): Locator {
    return this.main().getByRole('link', { name: 'Apply as an artist' });
  }

  /** The "Artists" tag after the brand on the workspace bar. */
  roleTag(): Locator {
    return this.page.getByRole('banner').locator('.topbar__role');
  }

  private main(): Locator {
    return this.page.getByRole('main');
  }
}
