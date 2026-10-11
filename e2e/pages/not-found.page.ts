import type { Locator, Page, Request } from '@playwright/test';
import { Ticket } from './lineup';
import { Shell } from './shell';

/** What the server answered for an address, without following a redirect. */
export interface ServerAnswer {
  status: number;
  location: string | null;
}

/**
 * The not-found page (docs/mocks/pages/not-found): the generic 404 for an unknown address, and the
 * missing-artist 404 with similar artists that `/artists/{slug}` renders in place of a profile.
 */
export class NotFoundPage {
  readonly shell: Shell;
  private readonly profileRequests: Request[] = [];

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
    page.on('request', (request) => {
      if (/^\/api\/v1\/artists\/[^/]+$/.test(new URL(request.url()).pathname)) {
        this.profileRequests.push(request);
      }
    });
  }

  /** Opens an address in the browser and returns the HTTP status of the document. */
  async open(path: string): Promise<number> {
    const response = await this.page.goto(path, { waitUntil: 'networkidle' });
    return response?.status() ?? 0;
  }

  /** Asks the web server for an address as a crawler would, without following a redirect. */
  async ask(path: string): Promise<ServerAnswer> {
    const response = await this.page.request.get(path, { maxRedirects: 0 });
    return { status: response.status(), location: response.headers()['location'] ?? null };
  }

  /** The path and query in the address bar. */
  address(): string {
    const url = new URL(this.page.url());
    return `${url.pathname}${url.search}`;
  }

  /**
   * From now on the browser's profile requests for `visible` reach `hidden` instead: the artist was
   * hidden after the lineup listed them.
   */
  async hideAfterListing(visible: string, hidden: string): Promise<void> {
    await this.page.route(new RegExp(`/api/v1/artists/${visible}(\\?|$)`), (route) =>
      route.continue({
        url: route.request().url().replace(`/artists/${visible}`, `/artists/${hidden}`),
      }),
    );
  }

  /** Profile requests the browser made itself (the server's own fetch is not seen here). */
  profileRequestsFromBrowser(): number {
    return this.profileRequests.length;
  }

  private column(): Locator {
    return this.page.locator('.error-page');
  }

  /** "Error 404 · Artist not found". */
  overline(): Locator {
    return this.column().locator('.overline');
  }

  /** The page's one level-one heading. */
  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "No show" when it is decoration beside a separate heading. */
  decorativePoster(): Locator {
    return this.column().locator('p.error-poster[aria-hidden="true"]');
  }

  lead(): Locator {
    return this.column().locator('.lead');
  }

  /** The column's recovery links, in order. */
  actions(): Locator {
    return this.column().locator('.cluster').getByRole('link');
  }

  /** "Followed a link from one of our emails? Tell us and we’ll fix it." */
  note(): Locator {
    return this.column().locator('.text-muted');
  }

  async findWhosFree(): Promise<void> {
    await this.column().getByRole('link', { name: 'Find who’s free' }).click();
  }

  // Similar artists (L2-021.1)

  private similar(): Locator {
    return this.page.getByRole('region', { name: 'Free that night instead' });
  }

  similarSection(): Locator {
    return this.similar();
  }

  /** "Sat 14 Nov · within 120 km of Burlington". */
  similarKicker(): Locator {
    return this.similar().locator('.section__kicker');
  }

  similarNames(): Locator {
    return this.similar().getByRole('listitem').getByRole('heading', { level: 3 });
  }

  similarList(): Locator {
    return this.similar().getByRole('list');
  }

  suggestion(name: string): Ticket {
    return new Ticket(
      this.similar()
        .getByRole('listitem')
        .filter({ has: this.page.getByRole('heading', { name, level: 3 }) }),
    );
  }

  fullLineupLink(): Locator {
    return this.similar().getByRole('link', { name: 'See the full lineup' });
  }
}
