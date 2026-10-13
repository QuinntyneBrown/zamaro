import type { Locator, Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/** Saved artists at `/saved` (docs/mocks/pages/saved): a booker's shortlist as ticket cards. */
export class SavedPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens `/saved` directly. */
  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/saved', { waitUntil: 'networkidle' });
  }

  /** Opens `/saved` without waiting for its requests, for a list that is held. */
  async openWithoutWaiting(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/saved');
  }

  /** The path in the address bar. */
  path(): string {
    return new URL(this.page.url()).pathname;
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "3 saved · free or booked on Sat 14 Nov, your last search". */
  subtitle(): Locator {
    return this.main().locator('.page-head__sub');
  }

  dateField(): Locator {
    return this.main().getByLabel('Who’s free on');
  }

  /** Picks a date under "Who’s free on", presses Check date and waits for the list. */
  async checkDate(date: string): Promise<void> {
    await this.dateField().fill(date);
    const answered = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/saved-artists',
    );
    await this.main().getByRole('button', { name: 'Check date' }).click();
    await answered;
  }

  private list(): Locator {
    return this.main().getByRole('list', {
      name: 'Your saved artists, most recently saved first',
    });
  }

  cards(): Locator {
    return this.list().getByRole('listitem');
  }

  cardNames(): Locator {
    return this.list().getByRole('heading', { level: 2 });
  }

  card(artist: string): SavedCard {
    return new SavedCard(
      this.cards().filter({
        has: this.page.getByRole('heading', { level: 2, name: artist, exact: true }),
      }),
      artist,
    );
  }

  /** "Only you can see who you saved. …". */
  note(): Locator {
    return this.main().locator('.saved-note');
  }

  emptyTitle(): Locator {
    return this.main().getByRole('heading', { name: 'No saved artists yet' });
  }

  emptyText(): Locator {
    return this.main().locator('.empty').getByText('Tap the heart', { exact: false });
  }

  findWhosFreeLink(): Locator {
    return this.main().getByRole('link', { name: 'Find who’s free' });
  }

  alert(): Locator {
    return this.main().getByRole('alert');
  }

  alertTitle(): Locator {
    return this.alert().locator('.alert__title');
  }

  alertText(): Locator {
    return this.alert().getByText('They’re still saved', { exact: false });
  }

  tryAgainButton(): Locator {
    return this.alert().getByRole('button', { name: 'Try again' });
  }

  backToDiscoverLink(): Locator {
    return this.alert().getByRole('link', { name: 'Back to Discover' });
  }

  /** "Loading your saved artists…", read to assistive technology while the list loads. */
  loadingStatus(): Locator {
    return this.main().getByRole('status').filter({ hasText: 'Loading' });
  }

  skeletons(): Locator {
    return this.main().locator('.ticket--loading');
  }

  /** Everything under the page head: the list, the empty state or the alert. */
  body(): Locator {
    return this.main().locator('.page-body');
  }

  main(): Locator {
    return this.page.getByRole('main');
  }

  async waitForList(): Promise<void> {
    await this.cards().first().waitFor();
  }

  /** The list request fails on the server's side until `unrouteAll`. */
  async failList(): Promise<void> {
    await this.page.route(LIST, (route) =>
      route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/problem+json' },
        body: JSON.stringify({ title: 'Something went wrong', status: 500 }),
      }),
    );
  }

  /** The list request never answers. */
  async holdList(): Promise<void> {
    await this.page.route(LIST, () => new Promise<void>(() => undefined));
  }
}

/** `GET /api/v1/saved-artists`, with or without a date; not the ids or a save. */
const LIST = (url: URL): boolean => url.pathname === '/api/v1/saved-artists';

/** One saved artist's ticket. */
export class SavedCard {
  constructor(
    private readonly root: Locator,
    private readonly artist: string,
  ) {}

  locator(): Locator {
    return this.root;
  }

  /** "Saved Wed 7 Oct". */
  kicker(): Locator {
    return this.root.locator('.ticket__no');
  }

  nameLink(): Locator {
    return this.root.getByRole('link', { name: this.artist, exact: true });
  }

  /** "Solo vocalist · Hymns" and "Brampton · 44 km from you". */
  meta(): Locator {
    return this.root.locator('.ticket__meta');
  }

  price(): Locator {
    return this.root.locator('.ticket__price');
  }

  /** "Free Sat 14 Nov" or "Booked Sun 15 Nov". */
  availability(): Locator {
    return this.root.locator('.ticket__actions .badge');
  }

  requestLink(): Locator {
    return this.root.getByRole('link', { name: /^Request / });
  }

  seeFreeDatesLink(): Locator {
    return this.root.getByRole('link', { name: /^See free dates/ });
  }

  saveToggle(): Locator {
    return this.root.getByRole('button', {
      name: new RegExp(`^(Save ${this.artist} to|Remove ${this.artist} from) your saved artists$`),
    });
  }
}
