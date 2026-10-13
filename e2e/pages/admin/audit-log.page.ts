import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { Shell } from '../shell';

const PROBLEM = { 'Content-Type': 'application/problem+json' };

/** The read-only audit log at `/admin/audit` (docs/mocks/pages/admin-audit): filters, the table, older entries. */
export class AuditLogPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/admin/audit');
    await expect(this.heading()).toHaveText('Audit log');
  }

  /** The entries never answer, so the table stays loading. */
  async holdEntries(): Promise<void> {
    await this.page.route(
      '**/api/v1/admin/audit-entries**',
      () => new Promise<void>(() => undefined),
    );
  }

  /** The entries fail on the server's side. */
  async failEntries(): Promise<void> {
    await this.page.route('**/api/v1/admin/audit-entries**', (route) =>
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

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  private filters(): Locator {
    return this.page.getByRole('search', { name: 'Filter the audit log' });
  }

  actorField(): Locator {
    return this.filters().getByRole('textbox', { name: 'Actor email' });
  }

  actionField(): Locator {
    return this.filters().getByRole('combobox', { name: 'Action' });
  }

  targetField(): Locator {
    return this.filters().getByRole('textbox', { name: 'Target' });
  }

  outcomeField(): Locator {
    return this.filters().getByRole('combobox', { name: 'Outcome' });
  }

  fromField(): Locator {
    return this.filters().getByLabel('From', { exact: true });
  }

  toField(): Locator {
    return this.filters().getByLabel('To', { exact: true });
  }

  filterButton(): Locator {
    return this.filters().getByRole('button', { name: 'Filter', exact: true });
  }

  /** The filter form's own "Clear filters". */
  resetButton(): Locator {
    return this.filters().getByRole('button', { name: 'Clear filters' });
  }

  /** The no-results state's "Clear filters". */
  clearFiltersButton(): Locator {
    return this.page.locator('.empty').getByRole('button', { name: 'Clear filters' });
  }

  /** Chooses an action code and applies the filters, waiting for the answer. */
  async filterByAction(action: string): Promise<void> {
    await this.actionField().selectOption(action);
    await this.apply();
  }

  async apply(): Promise<void> {
    const answered = this.answer();
    await this.filterButton().click();
    await answered;
  }

  async clearFilters(): Promise<void> {
    const answered = this.answer();
    await this.clearFiltersButton().click();
    await answered;
  }

  private answer(): Promise<unknown> {
    return this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/admin/audit-entries',
    );
  }

  table(): Locator {
    return this.page.locator('table.table');
  }

  caption(): Locator {
    return this.table().locator('caption');
  }

  /** The column headers, in order. */
  headers(): Locator {
    return this.table().locator('thead th');
  }

  rows(): Locator {
    return this.table().locator('tbody tr');
  }

  row(index: number): AuditRow {
    return new AuditRow(this.rows().nth(index));
  }

  /** Skeleton rows while loading. */
  skeletonRows(): Locator {
    return this.table()
      .locator('tbody tr')
      .filter({ has: this.page.locator('.skeleton') });
  }

  async isBusy(): Promise<boolean> {
    return (await this.table().getAttribute('aria-busy')) === 'true';
  }

  olderEntriesButton(): Locator {
    return this.page.getByRole('button', { name: 'Show older entries' });
  }

  /** "No entries match these filters". */
  noResultsTitle(): Locator {
    return this.page.locator('.empty__title');
  }

  errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  errorTitle(): Locator {
    return this.errorAlert().locator('.alert__title');
  }

  tryAgainButton(): Locator {
    return this.errorAlert().getByRole('button', { name: 'Try again' });
  }

  async waitForRows(): Promise<void> {
    await expect(this.rows().first()).toBeVisible();
    await expect(this.skeletonRows()).toHaveCount(0);
  }
}

/** One audit row: when, actor (two lines), action code, target, address, outcome badge. */
export class AuditRow {
  constructor(readonly root: Locator) {}

  when(): Locator {
    return this.root.locator('th[scope="row"]');
  }

  actorName(): Locator {
    return this.root.locator('td').nth(0).locator('> :not(.text-caption)').first();
  }

  /** "priya@zamaro.ca · Administrator", or "tried admin@riversidecc.ca". */
  actorCaption(): Locator {
    return this.root.locator('td').nth(0).locator('.text-caption');
  }

  action(): Locator {
    return this.root.locator('td').nth(1).locator('code');
  }

  target(): Locator {
    return this.root.locator('td').nth(2);
  }

  address(): Locator {
    return this.root.locator('td').nth(3);
  }

  outcome(): Locator {
    return this.root.locator('td').nth(4).locator('.badge');
  }
}
