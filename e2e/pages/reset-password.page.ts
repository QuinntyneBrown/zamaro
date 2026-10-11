import { expect, type Locator, type Page } from "@playwright/test";
import { freezeClock } from "../fixtures/clock";
import { Shell } from "./shell";

/**
 * Choose a new password at `/reset-password/{token}` (docs/mocks/pages/reset-password): "Checking
 * your reset link…", then the new password twice, then "Password changed"; or "This link has expired".
 */
export class ResetPasswordPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens a link from an email, which names the e2e site, and waits for the check's answer. */
  async openLink(link: string): Promise<void> {
    const answered = this.page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/password/reset/check",
    );
    await this.startLink(link);
    await answered;
  }

  /** Opens a link without waiting for its check, which may never answer. */
  async startLink(link: string): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto(new URL(link).pathname);
  }

  /** The check never answers, so the card keeps checking. */
  async holdCheck(): Promise<void> {
    await this.page.route(
      "**/api/v1/password/reset/check",
      () => new Promise<void>(() => undefined),
    );
  }

  /** Types the new password twice and presses Save new password. */
  async choose(password: string, again: string = password): Promise<void> {
    await expect(this.password()).toBeEditable();
    await this.password().fill(password);
    await this.confirmation().fill(again);
    await this.submitButton().click();
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  // "Checking your reset link…" (docs/mocks/pages/reset-password/loading)

  private checkingCard(): Locator {
    return this.page.getByRole("region", { name: "Choose a new password" });
  }

  checkingStatus(): Locator {
    return this.checkingCard().getByRole("status");
  }

  checkingButton(): Locator {
    return this.checkingCard().getByRole("button");
  }

  // The form (docs/mocks/pages/reset-password/default and invalid)

  private form(): Locator {
    return this.page.getByRole("form", { name: "Choose a new password" });
  }

  /** "For naomi.fraser@riversidecc.ca. Saving signs you out on every other device." */
  lead(): Locator {
    return this.form().locator(".lead");
  }

  password(): Locator {
    return this.form().getByLabel(/^New password/);
  }

  confirmation(): Locator {
    return this.form().getByLabel(/^Type it again/);
  }

  submitButton(): Locator {
    return this.form().getByRole("button");
  }

  errorSummaryTitle(): Locator {
    return this.form().locator(".error-summary").getByRole("heading");
  }

  errorSummaryLinks(): Locator {
    return this.form().locator(".error-summary").getByRole("link");
  }

  passwordError(): Locator {
    return this.form().locator("#new-password-error");
  }

  confirmationError(): Locator {
    return this.form().locator("#confirm-password-error");
  }

  // "Password changed" (docs/mocks/pages/reset-password/success)

  private changedCard(): Locator {
    return this.page.getByRole("region", { name: "Password changed" });
  }

  changedLead(): Locator {
    return this.changedCard().locator(".lead");
  }

  changedFinePrint(): Locator {
    return this.changedCard().locator(".stub__fine");
  }

  // "This link has expired" (docs/mocks/pages/reset-password/expired)

  private expiredCard(): Locator {
    return this.page.getByRole("region", { name: "This link has expired" });
  }

  expiredText(): Locator {
    return this.expiredCard()
      .locator("p")
      .filter({ hasText: "Reset links work once" });
  }

  expiredFinePrint(): Locator {
    return this.expiredCard().locator(".stub__fine");
  }

  sendNewLinkButton(): Locator {
    return this.expiredCard().getByRole("button", {
      name: /^(Send a new link|Sent)$/,
    });
  }

  async sendNewLink(): Promise<void> {
    await this.sendNewLinkButton().click();
  }
}
