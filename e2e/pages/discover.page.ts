import type { Locator, Page, Request } from '@playwright/test';
import { FROZEN_NOW } from '../fixtures/clock';
import { Lineup } from './lineup';
import { SearchForm } from './search-form';
import { Shell, type Theme } from './shell';

/** Discover: the home page at `/` (docs/mocks/pages/discover). */
export class DiscoverPage {
  readonly shell: Shell;
  readonly form: SearchForm;
  readonly lineup: Lineup;
  private readonly catalogueRequests: Request[] = [];
  private readonly searchRequests: Request[] = [];

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
    this.form = new SearchForm(page);
    this.lineup = new Lineup(page);
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (path.startsWith('/api/v1/i18n/')) this.catalogueRequests.push(request);
      if (path === '/api/v1/search') this.searchRequests.push(request);
    });
  }

  /** The app's today is Fri 9 Oct 2026 (docs/mocks/README.md). */
  async freezeClock(): Promise<void> {
    await this.page.clock.setFixedTime(FROZEN_NOW);
  }

  /** "Who’s free Sat 14 Nov". */
  posterHeadline(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  searchesSent(): number {
    return this.searchRequests.length;
  }

  /** Marks the current document so a full page load can be detected later. */
  async markDocument(): Promise<void> {
    await this.page.evaluate(() => ((window as unknown as { zmMarker: boolean }).zmMarker = true));
  }

  async documentWasReloaded(): Promise<boolean> {
    return this.page.evaluate(() => !(window as unknown as { zmMarker?: boolean }).zmMarker);
  }

  focusedElement(): Locator {
    return this.page.locator(':focus');
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
