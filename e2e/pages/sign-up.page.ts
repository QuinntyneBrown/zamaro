import type { Locator, Page, Request } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

export interface Registration {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
  news?: boolean;
}

/**
 * Sign up at `/sign-up` (docs/mocks/pages/sign-up): the "Admit one · New account" card, then
 * "Check your email to finish signing up".
 */
export class SignUpPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens the page and waits for the app to take over. */
  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/sign-up', { waitUntil: 'networkidle' });
  }

  /** Fills the form as given, then presses Create account. */
  async register(registration: Registration): Promise<void> {
    await this.fill(registration);
    await this.submit();
  }

  async fill({ name, email, password, acceptTerms, news = false }: Registration): Promise<void> {
    await this.name().fill(name);
    await this.email().fill(email);
    await this.password().fill(password);
    await this.terms().setChecked(acceptTerms);
    await this.news().setChecked(news);
  }

  async submit(): Promise<void> {
    await this.submitButton().click();
  }

  /** The registration request never answers, so the card stays busy. */
  async holdRegistration(): Promise<void> {
    await this.page.route('**/api/v1/register', () => new Promise<void>(() => undefined));
  }

  /** The registration request fails on the server's side. */
  async failRegistration(): Promise<void> {
    await this.page.route('**/api/v1/register', (route) =>
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

  /**
   * The bot check fails: the request reaches the API with the token the fake provider refuses, as a
   * real provider would refuse an automated submission.
   */
  async failBotCheck(): Promise<void> {
    await this.page.route('**/api/v1/register', (route) =>
      route.continue({
        postData: JSON.stringify({ ...route.request().postDataJSON(), challengeToken: 'fail' }),
      }),
    );
  }

  /** Every registration request the page sends from now on. */
  registrationRequests(): Request[] {
    const sent: Request[] = [];
    this.page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/register') {
        sent.push(request);
      }
    });
    return sent;
  }

  /** The path in the address bar. */
  path(): string {
    return new URL(this.page.url()).pathname;
  }

  private form(): Locator {
    return this.page.getByRole('form', { name: 'Create your account' });
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  name(): Locator {
    return this.form().getByRole('textbox', { name: /^Full name/ });
  }

  email(): Locator {
    return this.form().getByRole('textbox', { name: /^Email/ });
  }

  password(): Locator {
    return this.form().getByLabel(/^Password/);
  }

  terms(): Locator {
    return this.form().getByRole('checkbox', { name: /^I accept Zamaro’s terms/ });
  }

  news(): Locator {
    return this.form().getByRole('checkbox', { name: /^Email me about new artists/ });
  }

  submitButton(): Locator {
    return this.form().getByRole('button');
  }

  signInLink(): Locator {
    return this.form().getByRole('link', { name: 'Already have an account? Sign in' });
  }

  /** "Fix 2 things to continue" with one link per problem. */
  errorSummary(): Locator {
    return this.form().locator('.error-summary');
  }

  errorSummaryTitle(): Locator {
    return this.errorSummary().getByRole('heading');
  }

  errorSummaryLinks(): Locator {
    return this.errorSummary().getByRole('link');
  }

  passwordError(): Locator {
    return this.form().locator('#password-error');
  }

  termsError(): Locator {
    return this.form().locator('#terms-error');
  }

  alert(): Locator {
    return this.form().getByRole('alert');
  }

  alertTitle(): Locator {
    return this.alert().locator('.alert__title');
  }

  alertText(): Locator {
    return this.alert().locator('p').nth(1);
  }

  // "Check your email to finish signing up" (docs/mocks/pages/sign-up/success)

  private checkEmail(): Locator {
    return this.page.getByRole('region', { name: 'Check your email to finish signing up' });
  }

  checkEmailHeading(): Locator {
    return this.checkEmail().getByRole('heading', { level: 1 });
  }

  /** "We sent a link to … It works for 24 hours." */
  checkEmailLead(): Locator {
    return this.checkEmail().locator('.lead');
  }

  keepBrowsingLink(): Locator {
    return this.checkEmail().getByRole('link', { name: 'Keep browsing artists' });
  }

  startAgainLink(): Locator {
    return this.checkEmail().getByRole('link', { name: 'Wrong address? Start again' });
  }

  /** "Resend the email", then "Sent" for a minute. */
  resendButton(): Locator {
    return this.checkEmail().getByRole('button', { name: /^(Resend the email|Sent)$/ });
  }

  async resend(): Promise<void> {
    await this.resendButton().click();
  }

  /** "A new link is on its way…", once resent. */
  resentStatus(): Locator {
    return this.checkEmail().getByRole('status');
  }

  /** "Nothing after 5 minutes? Check spam or junk, then resend." */
  checkEmailFinePrint(): Locator {
    return this.checkEmail().locator('.stub__fine');
  }
}
