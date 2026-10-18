import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { Shell } from '../shell';

const PROBLEM = { 'Content-Type': 'application/problem+json' };
/** The queue's address: the list, not one application. */
const QUEUE = (url: URL) => url.pathname === '/api/v1/admin/artist-applications';

/**
 * The application queue at `/admin/applications` (docs/mocks/pages/admin-applications): the
 * Submitted applications, oldest first, each with a Review link to its review screen.
 */
export class ApplicationsPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/admin/applications');
    await expect(this.heading()).toHaveText('Applications');
  }

  /** The queue never answers, so the table stays loading. */
  async holdApplications(): Promise<void> {
    await this.page.route(QUEUE, () => new Promise<void>(() => undefined));
  }

  /** The queue fails on the server's side. */
  async failApplications(): Promise<void> {
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
  async answerNoApplications(): Promise<void> {
    await this.page.route(QUEUE, (route) =>
      route.fulfill({ json: { data: [], meta: { waiting: 0 } } }),
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

  /** "3 waiting · we reply within 3 business days", or "Nothing waiting". */
  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
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

  row(index: number): ApplicationRow {
    return new ApplicationRow(this.rows().nth(index));
  }

  /** The row whose header names the applicant. */
  rowFor(applicant: string): ApplicationRow {
    return new ApplicationRow(
      this.rows().filter({
        has: this.page.locator('th[scope="row"]', { hasText: applicant }),
      }),
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

/** One application: the applicant (a link), act, base city, when it was submitted, and Review. */
export class ApplicationRow {
  constructor(readonly root: Locator) {}

  applicant(): Locator {
    return this.root.locator('th[scope="row"]');
  }

  applicantLink(): Locator {
    return this.applicant().getByRole('link');
  }

  act(): Locator {
    return this.root.locator('td').nth(0);
  }

  city(): Locator {
    return this.root.locator('td').nth(1);
  }

  submitted(): Locator {
    return this.root.locator('td').nth(2);
  }

  reviewLink(): Locator {
    return this.root.getByRole('link', { name: /^Review/ });
  }
}
