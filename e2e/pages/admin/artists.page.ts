import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { Shell } from '../shell';

const PROBLEM = { 'Content-Type': 'application/problem+json' };
/** The list's address, with or without a search. */
const ARTISTS = (url: URL) => url.pathname === '/api/v1/admin/artists';

/**
 * The Artists list at `/admin/artists` (docs/mocks/pages/admin-artists): the counts, the link to the
 * check queue, the search, and every approved and suspended artist A to Z.
 */
export class ArtistsPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(query = ''): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto(`/admin/artists${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    await expect(this.heading()).toHaveText('Artists');
  }

  /** The list never answers, so the table stays loading. */
  async holdArtists(): Promise<void> {
    await this.page.route(ARTISTS, () => new Promise<void>(() => undefined));
  }

  /** The list fails on the server's side. */
  async failArtists(): Promise<void> {
    await this.page.route(ARTISTS, (route) =>
      route.fulfill({
        status: 500,
        headers: PROBLEM,
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Something went wrong',
          status: 500,
          detail: 'The server could not complete the request.',
        }),
      }),
    );
  }

  /** The API answers again as itself. */
  async answerNormally(): Promise<void> {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }

  overline(): Locator {
    return this.page.locator('.page-head .overline');
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "43 artists · 42 approved · 1 suspended". */
  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  /** "Vulnerable Sector Checks · 2 waiting". */
  checksLink(): Locator {
    return this.page.getByRole('link', { name: /^Vulnerable Sector Checks/ });
  }

  searchForm(): Locator {
    return this.page.getByRole('search');
  }

  searchField(): Locator {
    return this.searchForm().getByRole('textbox', { name: 'Search artists' });
  }

  searchHelp(): Locator {
    return this.searchForm().locator('.field__help');
  }

  /** Types a search and submits it, waiting for the answer. */
  async search(term: string): Promise<void> {
    const answered = this.answer();
    await this.searchField().fill(term);
    await this.searchField().press('Enter');
    await answered;
  }

  async clearSearch(): Promise<void> {
    const answered = this.answer();
    await this.clearSearchButton().click();
    await answered;
  }

  private answer(): Promise<unknown> {
    return this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/admin/artists',
    );
  }

  /** The path and query in the address bar. */
  address(): string {
    const url = new URL(this.page.url());
    return `${url.pathname}${url.search}`;
  }

  table(): Locator {
    return this.page.locator('table.table');
  }

  caption(): Locator {
    return this.table().locator('caption');
  }

  headers(): Locator {
    return this.table().locator('thead th');
  }

  rows(): Locator {
    return this.table().locator('tbody tr');
  }

  row(index: number): ArtistRow {
    return new ArtistRow(this.rows().nth(index));
  }

  rowFor(name: string): ArtistRow {
    return new ArtistRow(
      this.rows().filter({ has: this.page.locator('th[scope="row"]', { hasText: name }) }),
    );
  }

  skeletonRows(): Locator {
    return this.table()
      .locator('tbody tr')
      .filter({ has: this.page.locator('.skeleton') });
  }

  async isBusy(): Promise<boolean> {
    return (await this.table().getAttribute('aria-busy')) === 'true';
  }

  async waitForRows(): Promise<void> {
    await expect(this.rows().first()).toBeVisible();
    await expect(this.skeletonRows()).toHaveCount(0);
  }

  // The no-results state.

  noResultsTitle(): Locator {
    return this.page.locator('.empty__title');
  }

  noResults(): Locator {
    return this.page.locator('.empty');
  }

  clearSearchButton(): Locator {
    return this.noResults().getByRole('button', { name: 'Clear search' });
  }

  openApplicationsLink(): Locator {
    return this.noResults().getByRole('link', { name: 'Open applications' });
  }

  // The error state.

  errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  errorTitle(): Locator {
    return this.errorAlert().locator('.alert__title');
  }

  tryAgainButton(): Locator {
    return this.errorAlert().getByRole('button', { name: 'Try again' });
  }
}

/** One artist: the name (a link), act, base city, rating, status badge and Open. */
export class ArtistRow {
  constructor(readonly root: Locator) {}

  name(): Locator {
    return this.root.locator('th[scope="row"]');
  }

  nameLink(): Locator {
    return this.name().getByRole('link');
  }

  act(): Locator {
    return this.root.locator('td').nth(0);
  }

  city(): Locator {
    return this.root.locator('td').nth(1);
  }

  /** The rating cell: a labelled image, or "No reviews yet". */
  rating(): Locator {
    return this.root.locator('td').nth(2);
  }

  ratingImage(): Locator {
    return this.rating().getByRole('img');
  }

  status(): Locator {
    return this.root.locator('td').nth(3).locator('.badge');
  }

  /** "Open", named "Open Abigail Mensah". */
  openLink(): Locator {
    return this.root.getByRole('link', { name: /^Open / });
  }
}
