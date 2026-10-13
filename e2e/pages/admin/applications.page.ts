import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { Shell } from '../shell';

const PROBLEM = { 'Content-Type': 'application/problem+json' };
const QUEUE = '**/api/v1/admin/artist-applications';

/** The numbers the seed holds (CastSeeder): the queue the mocks show. */
export const SEEDED_APPLICATIONS = ['A-0217', 'A-0218', 'A-0219'];

/**
 * The applications queue at `/admin/applications` (docs/mocks/pages/admin-applications): submitted
 * applications oldest first, each with Review.
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

  /**
   * Keeps only the seeded applications in the API's answer, so applications the public-site specs
   * sent in the same run never change what this queue shows.
   */
  async showOnlyTheSeededApplications(): Promise<void> {
    await this.page.route(QUEUE, async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as {
        data: { number: string }[];
        meta: { waiting: number; lastDecidedAt: string | null };
      };
      const data = body.data.filter((row) => SEEDED_APPLICATIONS.includes(row.number));
      await route.fulfill({
        response,
        json: { data, meta: { ...body.meta, waiting: data.length } },
      });
    });
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

  /** Nothing is waiting; the last decision was on `lastDecidedAt`. */
  async answerNoApplications(lastDecidedAt: string | null = null): Promise<void> {
    await this.page.route(QUEUE, (route) =>
      route.fulfill({ json: { data: [], meta: { waiting: 0, lastDecidedAt } } }),
    );
  }

  /** The API answers again as itself. */
  async answerNormally(): Promise<void> {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  overline(): Locator {
    return this.page.locator('.page-head .overline');
  }

  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  loadingStatus(): Locator {
    return this.page.locator('.page-head__sub[role="status"]');
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
      this.rows().filter({ has: this.page.locator('th[scope="row"]', { hasText: applicant }) }),
    );
  }

  skeletonRows(): Locator {
    return this.table()
      .locator('tbody tr')
      .filter({ has: this.page.locator('.skeleton') });
  }

  async isBusy(): Promise<boolean> {
    return (
      (await this.page.locator('main zm-applications-page').getAttribute('aria-busy')) === 'true'
    );
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
    return this.page.getByRole('link', { name: 'Open artists' });
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

/** One row of the queue. */
export class ApplicationRow {
  constructor(readonly root: Locator) {}

  applicantLink(): Locator {
    return this.root.locator('th[scope="row"] a');
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
    return this.root.getByRole('link', { name: /^Review / });
  }
}
