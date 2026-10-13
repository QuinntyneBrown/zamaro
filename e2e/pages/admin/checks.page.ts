import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { Shell } from '../shell';

const PROBLEM = { 'Content-Type': 'application/problem+json' };
const QUEUE = '**/api/v1/admin/vulnerable-sector-checks';

/**
 * The Vulnerable Sector Check queue at `/admin/vulnerable-sector-checks` (docs/mocks/pages/admin-checks):
 * the checks waiting, oldest first, each with View document and Verify.
 */
export class ChecksPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/admin/vulnerable-sector-checks');
    await expect(this.heading()).toHaveText('Vulnerable Sector Checks');
  }

  /** The queue never answers, so the table stays loading. */
  async holdChecks(): Promise<void> {
    await this.page.route(QUEUE, () => new Promise<void>(() => undefined));
  }

  /** The queue fails on the server's side. */
  async failChecks(): Promise<void> {
    await this.page.route(QUEUE, (route) =>
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

  /** Nothing is waiting. */
  async answerNoChecks(): Promise<void> {
    await this.page.route(QUEUE, (route) =>
      route.fulfill({ json: { data: [], meta: { waiting: 0 } } }),
    );
  }

  /** The API answers again as itself. */
  async answerNormally(): Promise<void> {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  breadcrumb(): Locator {
    return this.page.getByRole('navigation', { name: 'Breadcrumb' });
  }

  /** The breadcrumb's "Artists" link. */
  artistsCrumb(): Locator {
    return this.breadcrumb().getByRole('link', { name: 'Artists' });
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

  row(index: number): CheckRow {
    return new CheckRow(this.rows().nth(index));
  }

  /** The row whose header names the artist. */
  rowFor(artist: string): CheckRow {
    return new CheckRow(
      this.rows().filter({ has: this.page.locator('th[scope="row"]', { hasText: artist }) }),
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

  /**
   * Opens the artist's document in a new tab and answers the address that tab asks for: the signed
   * link on the media host.
   */
  async viewDocument(row: CheckRow): Promise<{ url: string; tabs: number }> {
    const context = this.page.context();
    const asked = context.waitForEvent('request', (request) =>
      request.url().includes('/documents/'),
    );
    const popup = this.page.waitForEvent('popup');
    await row.viewDocumentButton().click();
    await popup;
    const url = (await asked).url();
    return { url, tabs: context.pages().length };
  }

  /** Verifies the row's check and waits for the API's decision. */
  async verify(row: CheckRow): Promise<number> {
    const decided = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().endsWith('/verification'),
    );
    await row.verifyButton().click();
    return (await decided).status();
  }

  // The empty state.

  emptyStamp(): Locator {
    return this.page.locator('.empty__stamp');
  }

  emptyTitle(): Locator {
    return this.page.locator('.empty__title');
  }

  emptyBody(): Locator {
    return this.page.locator('.empty');
  }

  openArtistsLink(): Locator {
    return this.page.locator('.empty').getByRole('link', { name: 'Open artists' });
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

/** One check: the artist (a link), issued, uploaded, what the check is, and its actions. */
export class CheckRow {
  constructor(readonly root: Locator) {}

  artist(): Locator {
    return this.root.locator('th[scope="row"]');
  }

  artistLink(): Locator {
    return this.artist().getByRole('link');
  }

  issued(): Locator {
    return this.root.locator('td').nth(0);
  }

  uploaded(): Locator {
    return this.root.locator('td').nth(1);
  }

  /** "First check", "Replaces the check verified until Fri 3 Mar 2028", or the verified line. */
  check(): Locator {
    return this.root.locator('td').nth(2);
  }

  /** The "Verified" badge once the check is verified. */
  checkBadge(): Locator {
    return this.check().locator('.badge');
  }

  viewDocumentButton(): Locator {
    return this.root.getByRole('button', { name: /^View document/ });
  }

  verifyButton(): Locator {
    return this.root.getByRole('button', { name: /^Verify/ });
  }
}
