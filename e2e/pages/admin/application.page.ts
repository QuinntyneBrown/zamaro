import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { Shell } from '../shell';

const PROBLEM = { 'Content-Type': 'application/problem+json' };

/** The review screen's data, as far as the page object rewrites it for a state. */
interface ApplicationJson {
  data: {
    status: string;
    decidedAt: string | null;
    decidedBy: { name: string } | null;
    references: { verifiedAt: string | null; verifiedBy: { name: string } | null }[];
  };
}

/**
 * The application review screen at `/admin/applications/{id}` (docs/mocks/pages/admin-application):
 * the applicant's details, bio, videos, references with their Verified ticks, the Vulnerable Sector
 * Check, and the decision panel.
 */
export class ApplicationPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(id: number): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto(`/admin/applications/${id}`);
    await expect(this.heading()).toBeVisible();
  }

  /** The application never answers, so the page stays loading. */
  async holdApplication(id: number): Promise<void> {
    await this.page.route(
      `**/api/v1/admin/artist-applications/${id}`,
      () => new Promise<void>(() => undefined),
    );
  }

  /** The application fails on the server's side. */
  async failApplication(id: number): Promise<void> {
    await this.page.route(`**/api/v1/admin/artist-applications/${id}`, (route) =>
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

  /** The API's own answer, with both references verified by Priya (the `verified` mock). */
  async answerVerified(id: number): Promise<void> {
    await this.rewrite(id, (json) => {
      json.data.references.forEach((reference, index) => {
        reference.verifiedAt =
          index === 0 ? '2026-10-09T13:50:00-04:00' : '2026-10-09T14:05:00-04:00';
        reference.verifiedBy = { name: 'Priya Nair' };
      });
    });
  }

  /** The API's own answer, approved by Priya at 2:10 p.m. (the `approved` mock). */
  async answerApproved(id: number): Promise<void> {
    await this.rewrite(id, (json) => {
      json.data.references.forEach((reference, index) => {
        reference.verifiedAt =
          index === 0 ? '2026-10-09T13:50:00-04:00' : '2026-10-09T14:05:00-04:00';
        reference.verifiedBy = { name: 'Priya Nair' };
      });
      json.data.status = 'approved';
      json.data.decidedAt = '2026-10-09T14:10:00-04:00';
      json.data.decidedBy = { name: 'Priya Nair' };
    });
  }

  async answerNormally(): Promise<void> {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }

  private async rewrite(id: number, change: (json: ApplicationJson) => void): Promise<void> {
    await this.page.route(`**/api/v1/admin/artist-applications/${id}`, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const response = await route.fetch();
      const json = (await response.json()) as ApplicationJson;
      change(json);
      return route.fulfill({ response, json });
    });
  }

  breadcrumb(): Locator {
    return this.page.getByRole('navigation', { name: 'Breadcrumb' });
  }

  /** The crumbs' text, in order: "Applications", "Tobi Adeyemi". */
  crumbs(): Locator {
    return this.breadcrumb().locator('li');
  }

  applicationsCrumb(): Locator {
    return this.breadcrumb().getByRole('link', { name: 'Applications' });
  }

  /** "Application A-0219". */
  overline(): Locator {
    return this.page.locator('.page-head .overline');
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "Solo vocalist · Acoustic, Hymns · Scarborough, ON · submitted Fri 9 Oct, 10:42 a.m." */
  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  /** The status badge beside the title. */
  headBadge(): Locator {
    return this.page.locator('.page-head .badge');
  }

  async isBusy(): Promise<boolean> {
    return (
      (await this.page.locator('main zm-application-page').getAttribute('aria-busy')) === 'true'
    );
  }

  loadingStatus(): Locator {
    return this.page.locator('.page-head [role="status"]');
  }

  private panel(title: string): Locator {
    return this.page.locator('.panel').filter({
      has: this.page.getByRole('heading', { level: 2, name: title, exact: true }),
    });
  }

  /** An Applicant value by its term: detail('Email'). */
  detail(term: string): Locator {
    return this.panel('Applicant')
      .locator('.definition__row')
      .filter({ has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }

  detailTerms(): Locator {
    return this.panel('Applicant').locator('dt');
  }

  bio(): Locator {
    return this.panel('Bio');
  }

  /** "336 characters". */
  bioCaption(): Locator {
    return this.bio().locator('.text-caption');
  }

  videos(): Locator {
    return this.panel('Videos').locator('.media-grid > li');
  }

  videosCaption(): Locator {
    return this.panel('Videos').locator('.panel__head .text-caption');
  }

  references(): Locator {
    return this.panel('Church references');
  }

  /** "0 of 2 verified". */
  referencesCaption(): Locator {
    return this.references().locator('.panel__head .text-caption');
  }

  reference(index: number): ReferenceBlock {
    return new ReferenceBlock(this.references().locator('.reference').nth(index));
  }

  check(): Locator {
    return this.panel('Vulnerable Sector Check');
  }

  decision(): Locator {
    return this.page.locator('aside .panel');
  }

  /** "Verify both references before you approve." or "Both references verified." */
  approveHelp(): Locator {
    return this.decision().locator('.inline-msg');
  }

  approveButton(): Locator {
    return this.decision().getByRole('button', { name: /^Approve/ });
  }

  rejectButton(): Locator {
    return this.decision().getByRole('button', { name: /^Reject/ });
  }

  /** A Decision value by its term, once decided: decided('Artist role'). */
  decided(term: string): Locator {
    return this.decision()
      .locator('.definition__row')
      .filter({ has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }

  /** The success notice after approval. */
  approvedNotice(): Locator {
    return this.page.getByRole('status').filter({ has: this.page.locator('.alert__title') });
  }

  /** Approves and waits for the API's decision. */
  async approve(): Promise<number> {
    const decided = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().endsWith('/approval'),
    );
    await this.approveButton().click();
    return (await decided).status();
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

  backToApplicationsLink(): Locator {
    return this.errorAlert().getByRole('link', { name: 'Back to applications' });
  }
}

/** One church reference: name, church, contact, and its Verified tick. */
export class ReferenceBlock {
  constructor(readonly root: Locator) {}

  /** A value by its term: detail('Church'). */
  detail(term: string): Locator {
    return this.root
      .locator('.definition__row')
      .filter({ has: this.root.locator('dt', { hasText: term }) })
      .locator('dd');
  }

  verifiedBox(): Locator {
    return this.root.getByRole('checkbox', { name: /^Reference verified/ });
  }

  /** The line under the tick: the instruction, or "Verified by Priya Nair, Fri 9 Oct, 1:50 p.m." */
  description(): Locator {
    return this.root.locator('.choice small');
  }

  /** Ticks or unticks the reference and waits for the API to save it. */
  async setVerified(verified: boolean): Promise<number> {
    const saved = this.root
      .page()
      .waitForResponse(
        (response) =>
          response.request().method() === 'PUT' && response.url().endsWith('/verification'),
      );
    await this.verifiedBox().setChecked(verified);
    return (await saved).status();
  }
}
