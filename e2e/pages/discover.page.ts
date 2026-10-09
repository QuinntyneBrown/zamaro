import type { Page, Request } from '@playwright/test';
import { Shell } from './shell';

/** Discover: the home page at `/` (docs/mocks/pages/discover). */
export class DiscoverPage {
  readonly shell: Shell;
  private readonly catalogueRequests: Request[] = [];

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/v1/i18n/')) {
        this.catalogueRequests.push(request);
      }
    });
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  /** Opens the page and waits until the browser app has hydrated and gone quiet. */
  async openAndHydrate(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'networkidle' });
  }

  /** Translation catalogue requests the browser made itself (the server's own fetch is not seen here). */
  catalogueRequestsFromBrowser(): number {
    return this.catalogueRequests.length;
  }

  async useWidth(width: number): Promise<void> {
    await this.page.setViewportSize({ width, height: 800 });
  }
}
