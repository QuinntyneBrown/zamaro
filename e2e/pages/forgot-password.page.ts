import { expect, type Locator, type Page } from "@playwright/test";
import { freezeClock } from "../fixtures/clock";
import { Shell } from "./shell";

/**
 * Forgot your password at `/forgot-password` (docs/mocks/pages/forgot-password): the email, then
 * "Check your email" whether or not it has an account.
 */
export class ForgotPasswordPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens the page and waits for the app to take over: it puts focus in Email once it has. */
  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto("/forgot-password", { waitUntil: "networkidle" });
    await expect(this.email()).toBeFocused();
  }

  /** Types the email and presses Send reset link. */
  async askFor(email: string): Promise<void> {
    await this.email().fill(email);
    await this.submitButton().click();
  }

  /**
   * The bot check fails: the request reaches the API with the token the fake provider refuses, as a
   * real provider would refuse an automated submission.
   */
  async failBotCheck(): Promise<void> {
    await this.page.route("**/api/v1/password/forgot", (route) =>
      route.continue({
        postData: JSON.stringify({
          ...route.request().postDataJSON(),
          challengeToken: "fail",
        }),
      }),
    );
  }

  /** The request never answers, so the card stays busy. */
  async holdRequest(): Promise<void> {
    await this.page.route(
      "**/api/v1/password/forgot",
      () => new Promise<void>(() => undefined),
    );
  }

  path(): string {
    return new URL(this.page.url()).pathname;
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  private form(): Locator {
    return this.page.getByRole("form", { name: "Forgot your password?" });
  }

  email(): Locator {
    return this.form().getByRole("textbox", { name: /^Email/ });
  }

  submitButton(): Locator {
    return this.form().getByRole("button");
  }

  signInLink(): Locator {
    return this.form().getByRole("link", { name: "Remembered it? Sign in" });
  }

  errorSummaryTitle(): Locator {
    return this.form().locator(".error-summary").getByRole("heading");
  }

  emailError(): Locator {
    return this.form().locator("#email-error");
  }

  alertTitle(): Locator {
    return this.form().getByRole("alert").locator(".alert__title");
  }

  // "Check your email" (docs/mocks/pages/forgot-password/success)

  private checkEmail(): Locator {
    return this.page.getByRole("region", { name: "Check your email" });
  }

  checkEmailLead(): Locator {
    return this.checkEmail().locator(".lead");
  }

  backToSignInLink(): Locator {
    return this.checkEmail().getByRole("link", { name: "Back to sign in" });
  }

  sendAgainButton(): Locator {
    return this.checkEmail().getByRole("button", {
      name: /^(Send it again|Sent)$/,
    });
  }
}
