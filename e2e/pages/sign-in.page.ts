import type { Cookie, Locator, Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/** Sign in at `/sign-in` (docs/mocks/pages/sign-in): the "Admit one · Your account" card. */
export class SignInPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens the page, coming from `returnUrl` when given, and waits for the app to take over. */
  async open(returnUrl?: string): Promise<void> {
    await freezeClock(this.page);
    const query = returnUrl === undefined ? '' : `?returnUrl=${encodeURIComponent(returnUrl)}`;
    await this.page.goto(`/sign-in${query}`, { waitUntil: 'networkidle' });
  }

  /** Opens the page as the app does when a session has ended: `?returnUrl=…&ended=1`. */
  async openAfterSessionEnded(returnUrl: string): Promise<void> {
    await freezeClock(this.page);
    const query = new URLSearchParams({ returnUrl, ended: '1' });
    await this.page.goto(`/sign-in?${query}`, { waitUntil: 'networkidle' });
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.email().fill(email);
    await this.password().fill(password);
    await this.submitButton().click();
  }

  /** The sign-in request never answers, so the card stays busy. */
  async holdSignIn(): Promise<void> {
    await this.page.route('**/api/v1/session', () => new Promise<void>(() => undefined));
  }

  /** The sign-in request fails on the server's side. */
  async failSignIn(): Promise<void> {
    await this.page.route('**/api/v1/session', (route) =>
      route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/problem+json' },
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Something went wrong',
          status: 500,
          detail: 'The server could not complete the request.',
        }),
      }),
    );
  }

  /** The path and query in the address bar. */
  address(): string {
    const url = new URL(this.page.url());
    return `${url.pathname}${url.search}`;
  }

  private card(): Locator {
    return this.page.getByRole('form', { name: 'Sign in' });
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  email(): Locator {
    return this.card().getByRole('textbox', { name: /^Email/ });
  }

  password(): Locator {
    return this.card().getByLabel(/^Password/);
  }

  submitButton(): Locator {
    return this.card().getByRole('button');
  }

  /** "Couldn’t sign you in" with one link per problem. */
  errorSummary(): Locator {
    return this.card().locator('.error-summary');
  }

  errorSummaryTitle(): Locator {
    return this.errorSummary().getByRole('heading');
  }

  errorSummaryLinks(): Locator {
    return this.errorSummary().getByRole('link');
  }

  /** The one message under both fields: "Email or password is incorrect." */
  credentialsError(): Locator {
    return this.card().locator('#credentials-error');
  }

  /** "Your session ended" and what is kept, above the fields. */
  sessionEnded(): Locator {
    return this.card().getByRole('status').filter({ hasText: 'Your session ended' });
  }

  /** The line under "Your session ended"; it names the kept draft once drafts exist (M5). */
  sessionEndedDetail(): Locator {
    return this.sessionEnded().locator('p').nth(1);
  }

  alert(): Locator {
    return this.card().getByRole('alert');
  }

  alertTitle(): Locator {
    return this.alert().locator('.alert__title');
  }

  /** The browser's session cookie for the site. */
  async sessionCookie(): Promise<Cookie | undefined> {
    const cookies = await this.page.context().cookies();
    return cookies.find((cookie) => cookie.name === 'zamaro_session');
  }
}
