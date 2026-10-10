import type { Page } from '@playwright/test';

const PROBLEM = { 'Content-Type': 'application/problem+json' };

/**
 * The browser's session with the API, and the answers the API gives it
 * (security/manage-sessions-and-csrf). The frozen clock cannot age a session, so an ended session
 * is the API's 401 answered here; the backend tests prove when the API gives it.
 */
export class Session {
  private readonly signOutStatuses: number[] = [];

  constructor(private readonly page: Page) {
    page.on('response', (response) => {
      const request = response.request();
      if (request.method() === 'DELETE' && new URL(request.url()).pathname === '/api/v1/session') {
        this.signOutStatuses.push(response.status());
      }
    });
  }

  /** Replaces the CSRF token the browser holds with one the API never issued. */
  async spoilCsrfToken(): Promise<void> {
    await this.page
      .context()
      .addCookies([
        { name: 'XSRF-TOKEN', value: 'not-a-token-the-api-issued', url: this.page.url() },
      ]);
  }

  /** Every sign-out is refused as a CSRF mismatch, however often it is tried. */
  async refuseSignOutAsCsrfMismatch(): Promise<void> {
    await this.page.route('**/api/v1/session', (route) =>
      route.request().method() === 'DELETE'
        ? route.fulfill({
            status: 419,
            headers: PROBLEM,
            body: JSON.stringify({
              type: 'https://zamaro.ca/problems/csrf-token-mismatch',
              title: 'The page’s security token didn’t match',
              status: 419,
              detail: 'Fetch /sanctum/csrf-cookie, then repeat the request with X-XSRF-TOKEN.',
            }),
          })
        : route.fallback(),
    );
  }

  /** The session ends on the server: from now on every API call answers 401. */
  async endOnServer(): Promise<void> {
    await this.page.route('**/api/v1/**', (route) =>
      route.fulfill({
        status: 401,
        headers: PROBLEM,
        body: JSON.stringify({
          type: 'https://zamaro.ca/problems/unauthenticated',
          title: 'Sign in to continue',
          status: 401,
          detail: 'This needs a signed-in account.',
        }),
      }),
    );
  }

  /** The API answers again as itself. */
  async answerNormally(): Promise<void> {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }

  /** The statuses of every sign-out request so far, in order. */
  signOutAnswers(): number[] {
    return [...this.signOutStatuses];
  }
}
