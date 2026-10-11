import type { Locator, Page } from "@playwright/test";

/**
 * "Turn off two-step sign-in?" and "Get new recovery codes?" (docs/mocks/dialogs/two-step-code): a
 * code from the app, or an unused recovery code, then the change or the new codes.
 */
export class TwoStepCodeDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  heading(): Locator {
    return this.dialog().getByRole("heading", { level: 2 });
  }

  /** The list of what turning off changes. */
  consequences(): Locator {
    return this.dialog().locator(".dialog__body ul li");
  }

  code(): Locator {
    return this.dialog().getByRole("textbox", { name: /^Code/ });
  }

  codeError(): Locator {
    return this.dialog().locator(".field__error");
  }

  /** Enters a code and presses the dialog's action, waiting for the API's answer. */
  async submit(code: string): Promise<void> {
    await this.code().fill(code);
    const answered = this.page.waitForResponse((response) =>
      new URL(response.url()).pathname.startsWith("/api/v1/account/two-factor"),
    );
    await this.actionButton().click();
    await answered;
  }

  /** "Turn off", "Get new codes", their busy labels or "Try again". */
  actionButton(): Locator {
    return this.dialog()
      .locator(".dialog__footer")
      .getByRole("button", {
        name: /^(Turn off|Get new codes|Turning off…|Getting codes…|Try again)$/,
      });
  }

  /** "Keep it on" or "Cancel": the way back. */
  wayBackButton(): Locator {
    return this.dialog()
      .locator(".dialog__footer")
      .getByRole("button", { name: /^(Keep it on|Cancel)$/ });
  }

  footerButtons(): Locator {
    return this.dialog().locator(".dialog__footer").getByRole("button");
  }

  errorSummaryTitle(): Locator {
    return this.dialog().locator(".error-summary").getByRole("heading");
  }

  errorSummaryLinks(): Locator {
    return this.dialog().locator(".error-summary").getByRole("link");
  }

  alertTitle(): Locator {
    return this.dialog().getByRole("alert").locator(".alert__title");
  }

  newCodes(): Locator {
    return this.dialog()
      .getByRole("list", { name: "10 new recovery codes" })
      .locator("code");
  }

  savedThemButton(): Locator {
    return this.dialog().getByRole("button", { name: "I’ve saved them" });
  }

  /** Makes the dialog's request never answer. */
  async holdRequests(): Promise<void> {
    await this.page.route("**/api/v1/account/two-factor**", (route) =>
      route.request().method() === "GET"
        ? route.fallback()
        : new Promise<void>(() => undefined),
    );
  }

  /** Makes the dialog's request fail on the server's side. */
  async failRequests(): Promise<void> {
    await this.page.route("**/api/v1/account/two-factor**", (route) =>
      route.request().method() === "GET"
        ? route.fallback()
        : route.fulfill({
            status: 500,
            headers: { "Content-Type": "application/problem+json" },
            body: JSON.stringify({
              title: "Something went wrong",
              status: 500,
            }),
          }),
    );
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
  }
}
