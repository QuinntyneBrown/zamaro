import type { Page, Request } from '@playwright/test';
import { Shell, type Theme } from './shell';

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

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  async useSystemTheme(theme: Theme): Promise<void> {
    await this.page.emulateMedia({ colorScheme: theme });
  }

  async preferReducedMotion(): Promise<void> {
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
  }

  /** As if the person chose `theme` on an earlier visit from this device. */
  async rememberThemeOnDevice(theme: Theme): Promise<void> {
    await this.page.addInitScript((value) => localStorage.setItem('zamaro.theme', value), theme);
  }

  /** Keeps the Angular app from starting, so only the server HTML and its inline script run. */
  async withoutTheApp(): Promise<void> {
    await this.page.route('**/*.js', (route) => route.abort());
  }
}
