import type { Locator, Page } from '@playwright/test';
import { Shell } from './shell';

/** An artist's public profile at `/artists/{slug}` (docs/mocks/pages/artist). */
export class ArtistProfilePage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(slug: string, date?: string): Promise<void> {
    await this.page.goto(`/artists/${slug}${date ? `?date=${date}` : ''}`, {
      waitUntil: 'networkidle',
    });
  }

  /** Replaces part of the profile the API returns, for the next loads made by the browser. */
  async alterProfile(slug: string, change: Record<string, unknown>): Promise<void> {
    await this.page.route(`**/api/v1/artists/${slug}`, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      await route.fulfill({
        response,
        json: { data: { ...body.data, ...change } },
      });
    });
  }

  async failProfile(slug: string): Promise<void> {
    await this.page.route(`**/api/v1/artists/${slug}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: '{}',
      }),
    );
  }

  async delayProfile(slug: string, ms: number): Promise<void> {
    await this.page.route(`**/api/v1/artists/${slug}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.continue();
    });
  }

  async restoreProfile(slug: string): Promise<void> {
    await this.page.unroute(`**/api/v1/artists/${slug}`);
  }

  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'networkidle' });
  }

  breadcrumbBack(): Locator {
    return this.page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link');
  }

  name(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  kicker(): Locator {
    return this.page.locator('.artist-poster .poster__kicker');
  }

  /** Each fact in the header, in order: rating, review count, base city, drive limit. */
  facts(): Locator {
    return this.page.locator('.artist-poster__facts > *');
  }

  rating(): Locator {
    return this.page.locator('.artist-poster__facts').getByRole('img');
  }

  bookButton(): Locator {
    return this.page.getByRole('button', { name: /^(Book for|Check dates)/ });
  }

  aboutHeading(): Locator {
    return this.page.locator('#about-title');
  }

  aboutParagraphs(): Locator {
    return this.page.locator('[aria-labelledby="about-title"] .section__body p');
  }

  setlistHeading(): Locator {
    return this.page.locator('#songs-title');
  }

  setlistNote(): Locator {
    return this.page.locator('[aria-labelledby="songs-title"] .section__head > p');
  }

  songs(): Locator {
    return this.page.locator('[aria-labelledby="songs-title"]').getByRole('listitem');
  }

  /** The loading region and its status line. */
  busyRegion(): Locator {
    return this.page.locator('[aria-busy="true"]');
  }

  loadingStatus(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Loading the artist’s profile…' });
  }

  errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  async tryAgain(): Promise<void> {
    await this.errorAlert().getByRole('button', { name: 'Try again' }).click();
  }

  backToLineup(): Locator {
    return this.errorAlert().getByRole('link', { name: 'Back to the lineup' });
  }

  /** True when a script in the page set `window.zmPwned`. */
  async scriptRan(): Promise<boolean> {
    return this.page.evaluate(() => 'zmPwned' in window);
  }
}
