import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { Shell } from '../shell';

const PROBLEM = { 'Content-Type': 'application/problem+json' };

/**
 * One application under review at `/admin/applications/{id}` (docs/mocks/pages/admin-application):
 * the applicant, the bio, the videos, the two references with their ticks, the Vulnerable Sector
 * Check and the decision.
 */
export class ApplicationPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(id: number): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto(`/admin/applications/${id}`);
    await expect(this.breadcrumb()).toBeVisible();
  }

  /** The application never answers, so the screen stays loading. */
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

  async answerNormally(): Promise<void> {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }

  breadcrumb(): Locator {
    return this.page.getByRole('navigation', { name: 'Breadcrumb' });
  }

  crumbs(): Locator {
    return this.breadcrumb().getByRole('listitem');
  }

  applicationsCrumb(): Locator {
    return this.breadcrumb().getByRole('link', { name: 'Applications' });
  }

  overline(): Locator {
    return this.page.locator('.page-head .overline');
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  headBadge(): Locator {
    return this.page.locator('.page-head zm-badge');
  }

  loadingStatus(): Locator {
    return this.page.locator('.page-head__sub[role="status"]');
  }

  async isBusy(): Promise<boolean> {
    return (await this.page.locator('main zm-application-page').getAttribute('aria-busy')) === 'true';
  }

  /** A panel by its heading: panel('Applicant'). */
  panel(title: string): Locator {
    return this.page.locator('.panel').filter({
      has: this.page.getByRole('heading', { level: 2, name: title, exact: true }),
    });
  }

  /** The small count beside a panel's heading: panelCaption('Videos') is "1 uploaded". */
  panelCaption(title: string): Locator {
    return this.panel(title).locator('.panel__head .text-caption');
  }

  /** An Applicant value by its term: applicant('Email'). */
  applicant(term: string): Locator {
    return this.definition(this.panel('Applicant'), term);
  }

  bio(): Locator {
    return this.panel('Bio').locator('p');
  }

  videos(): Locator {
    return this.panel('Videos').locator('zm-video-card');
  }

  videoCaption(index: number): Locator {
    return this.videos().nth(index).locator('.video__caption');
  }

  videoPlayButton(index: number): Locator {
    return this.videos().nth(index).getByRole('button');
  }

  // The references, 1 and 2.

  referencesLead(): Locator {
    return this.panel('Church references').locator('.text-muted').first();
  }

  private reference(index: 1 | 2): Locator {
    return this.panel('Church references')
      .locator('.reference')
      .nth(index - 1);
  }

  /** A reference's value by its term: referenceDetail(1, 'Phone or email'). */
  referenceDetail(index: 1 | 2, term: string): Locator {
    return this.definition(this.reference(index), term);
  }

  referenceTick(index: 1 | 2): Locator {
    return this.reference(index).getByRole('checkbox', { name: /^Reference verified/ });
  }

  /** "Call or email them, then tick when they vouch for Tobi." or "Verified by Priya Nair, Fri 9 Oct, 10:00 a.m." */
  referenceTickDescription(index: 1 | 2): Locator {
    return this.reference(index).locator('.check__desc');
  }

  /** Ticks or unticks a reference and waits for the API's answer. */
  async setReferenceTick(index: 1 | 2, verified: boolean): Promise<number> {
    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' && response.url().endsWith('/verification'),
    );
    await this.referenceTick(index).setChecked(verified);
    return (await saved).status();
  }

  vulnerableSectorCheck(): Locator {
    return this.panel('Vulnerable Sector Check').locator('p').first();
  }

  vulnerableSectorCheckNote(): Locator {
    return this.panel('Vulnerable Sector Check').locator('.text-caption');
  }

  // The decision.

  decision(): Locator {
    return this.page.locator('aside .panel--raised');
  }

  decisionCode(): Locator {
    return this.decision().locator('.stub__code');
  }

  approveHelp(): Locator {
    return this.decision().locator('.inline-msg');
  }

  approveButton(): Locator {
    return this.decision().getByRole('button', { name: /^Approve / });
  }

  rejectButton(): Locator {
    return this.decision().getByRole('button', { name: 'Reject…' });
  }

  decisionFine(): Locator {
    return this.decision().locator('.stub__fine');
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

  private definition(within: Locator, term: string): Locator {
    return within
      .locator('.definition__row')
      .filter({ has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }
}
