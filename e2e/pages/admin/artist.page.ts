import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../../fixtures/clock';
import { Shell } from '../shell';

const PROBLEM = { 'Content-Type': 'application/problem+json' };

/**
 * One artist as the administrator sees them, at `/admin/artists/{id}` (docs/mocks/pages/admin-artist):
 * the details, the upcoming bookings, the suspension history and the standing.
 */
export class ArtistPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(id: number): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto(`/admin/artists/${id}`);
    await expect(this.heading()).toBeVisible();
  }

  /** The artist never answers, so the page stays loading. */
  async holdArtist(id: number): Promise<void> {
    await this.page.route(
      `**/api/v1/admin/artists/${id}`,
      () => new Promise<void>(() => undefined),
    );
  }

  /** The artist fails on the server's side. */
  async failArtist(id: number): Promise<void> {
    await this.page.route(`**/api/v1/admin/artists/${id}`, (route) =>
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

  /** The crumbs' text, in order: "Artists", "Marcus Bell Trio". */
  crumbs(): Locator {
    return this.breadcrumb().locator('li');
  }

  artistsCrumb(): Locator {
    return this.breadcrumb().getByRole('link', { name: 'Artists' });
  }

  /** "Artist · approved Mon 2 Mar 2026". */
  overline(): Locator {
    return this.page.locator('.page-head .overline');
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "Band · Acoustic, Hymns · Hamilton, ON". */
  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  /** The status badge beside the title. */
  headBadge(): Locator {
    return this.page.locator('.page-head .badge');
  }

  /** The routed page carries `aria-busy` while its skeletons show. */
  async isBusy(): Promise<boolean> {
    return (await this.page.locator('main zm-artist-page').getAttribute('aria-busy')) === 'true';
  }

  /** "Loading the artist", while the skeletons show. */
  loadingStatus(): Locator {
    return this.page.locator('.page-head [role="status"]');
  }

  private panel(title: string): Locator {
    return this.page.locator('.panel').filter({
      has: this.page.getByRole('heading', { level: 2, name: title, exact: true }),
    });
  }

  /** A Details value by its term: detail('Account email'). */
  detail(term: string): Locator {
    return this.panel('Details')
      .locator('.definition__row')
      .filter({ has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }

  detailTerms(): Locator {
    return this.panel('Details').locator('dt');
  }

  bookings(): Locator {
    return this.panel('Upcoming bookings').locator('.tour-dates > li');
  }

  booking(index: number): BookingRow {
    return new BookingRow(this.bookings().nth(index));
  }

  /** "Never suspended.", or the suspensions on record. */
  history(): Locator {
    return this.panel('Suspension history');
  }

  standing(): Locator {
    return this.page.locator('aside .panel');
  }

  standingBadge(): Locator {
    return this.standing().locator('.badge');
  }

  standingButtons(): Locator {
    return this.standing().getByRole('button');
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

  backToArtistsLink(): Locator {
    return this.errorAlert().getByRole('link', { name: 'Back to artists' });
  }
}

/** One upcoming booking: the day stamp, "ZAM-0097 · Riverside Community Church", its note and stamp. */
export class BookingRow {
  constructor(readonly item: Locator) {}

  /** "Sun 25 Oct", the weekday and the day as one line. */
  async day(): Promise<string> {
    return this.item
      .locator('.tour-dates__day')
      .evaluate(
        (day) => `${day.querySelector('small')?.textContent} ${day.lastChild?.textContent}`,
      );
  }

  title(): Locator {
    return this.item.locator('strong');
  }

  note(): Locator {
    return this.item.locator('.tour-dates__note');
  }

  stamp(): Locator {
    return this.item.locator('zm-stamp');
  }
}
