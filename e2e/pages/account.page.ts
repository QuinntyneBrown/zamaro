import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

export interface ChurchDetails {
  name: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  phone: string;
  denomination?: string;
  typicalAttendance?: string;
}

/** Riverside Community Church as docs/mocks/README.md has it. */
export const RIVERSIDE: ChurchDetails = {
  name: 'Riverside Community Church',
  streetAddress: '2150 Lakeshore Road',
  city: 'Burlington',
  postalCode: 'L7R 1A3',
  phone: '905-555-0123',
  denomination: 'Non-denominational',
  typicalAttendance: '350',
};

/**
 * Account settings at `/account` (docs/mocks/pages/account): the settings nav, one form of sections
 * saved together from the sticky save bar, and the sections that act at once.
 */
export class AccountPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  /** Opens the page and waits until the settings have loaded into the form. */
  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/account');
    await expect(this.form()).toBeVisible();
  }

  /** Opens the page without waiting for the form, for a guest or a failed load. */
  async openOnly(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/account');
  }

  /** Fills the church section as given, leaving out what is not given. */
  async fillChurch(church: Partial<ChurchDetails>): Promise<void> {
    const fields: [keyof ChurchDetails, Locator][] = [
      ['name', this.churchName()],
      ['streetAddress', this.streetAddress()],
      ['city', this.city()],
      ['postalCode', this.postalCode()],
      ['phone', this.churchPhone()],
      ['denomination', this.denomination()],
      ['typicalAttendance', this.attendance()],
    ];
    for (const [key, field] of fields) {
      const value = church[key];
      if (value !== undefined) await field.fill(value);
    }
  }

  /** Presses Save changes and waits for the first request it sends to answer. */
  async save(): Promise<void> {
    const answered = this.page.waitForResponse(
      (response) =>
        response.request().method() !== 'GET' &&
        new URL(response.url()).pathname.startsWith('/api/v1/account/'),
    );
    await this.saveButton().click();
    await answered;
    await expect(this.saveButton()).not.toHaveAttribute('aria-busy', 'true');
  }

  async discard(): Promise<void> {
    await this.discardButton().click();
  }

  /** Every save request the page sends from now on. */
  saveRequests(): string[] {
    const sent: string[] = [];
    this.page.on('request', (request) => {
      if (
        request.method() === 'PUT' &&
        new URL(request.url()).pathname.startsWith('/api/v1/account/')
      ) {
        sent.push(new URL(request.url()).pathname);
      }
    });
    return sent;
  }

  /** Saving never answers, so the bar stays busy. */
  async holdSaves(): Promise<void> {
    await this.page.route('**/api/v1/account/**', (route) =>
      route.request().method() === 'PUT' ? new Promise<void>(() => undefined) : route.fallback(),
    );
  }

  /** Saving fails on the server's side. */
  async failSaves(): Promise<void> {
    await this.page.route('**/api/v1/account/**', (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({
            status: 500,
            headers: { 'Content-Type': 'application/problem+json' },
            body: JSON.stringify({ title: 'Something went wrong', status: 500 }),
          })
        : route.fallback(),
    );
  }

  /** Loading the settings fails, as if the network dropped. */
  async failLoading(): Promise<void> {
    await this.page.route('**/api/v1/account/church', (route) =>
      route.request().method() === 'GET' ? route.abort('failed') : route.fallback(),
    );
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await expect(this.form()).toBeVisible();
  }

  path(): string {
    const url = new URL(this.page.url());
    return `${url.pathname}${url.search}`;
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "Naomi Fraser · Riverside Community Church" under the heading. */
  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  settingsNav(): Locator {
    return this.page.getByRole('navigation', { name: 'Settings sections' });
  }

  settingsNavLinks(): Locator {
    return this.settingsNav().getByRole('link');
  }

  form(): Locator {
    return this.page.getByRole('form', { name: 'Account settings' });
  }

  section(name: string): Locator {
    return this.page.getByRole('region', { name, exact: true });
  }

  sectionLead(name: string): Locator {
    return this.section(name).locator('.form-section__lead');
  }

  /**
   * For captures: the Password lead as if there were two other devices, since how many there are
   * depends on which other specs signed in as the same cast member.
   */
  async fixPasswordLeadCount(): Promise<void> {
    await this.sectionLead('Password').evaluate((lead) => {
      lead.textContent = (lead.textContent ?? '').replace(
        /A new one signs you out on your other.*$/,
        'A new one signs you out on your other 2 devices.',
      );
    });
  }

  yourName(): Locator {
    return this.section('Profile').getByRole('textbox', { name: /^Your name/ });
  }

  churchName(): Locator {
    return this.section('Church').getByRole('textbox', { name: /^Church name/ });
  }

  streetAddress(): Locator {
    return this.section('Church').getByRole('textbox', { name: /^Street address/ });
  }

  city(): Locator {
    return this.section('Church').getByRole('textbox', { name: /^City/ });
  }

  postalCode(): Locator {
    return this.section('Church').getByRole('textbox', { name: /^Postal code/ });
  }

  churchPhone(): Locator {
    return this.section('Church').getByRole('textbox', { name: /^Contact phone/ });
  }

  denomination(): Locator {
    return this.section('Church').getByRole('textbox', { name: /^Denomination/ });
  }

  attendance(): Locator {
    return this.section('Church').getByRole('spinbutton', { name: /^Typical attendance/ });
  }

  newEmail(): Locator {
    return this.section('Email').getByRole('textbox', { name: /^New email/ });
  }

  /** The Email section's "Current password". */
  emailPassword(): Locator {
    return this.section('Email').getByLabel(/^Current password/);
  }

  /** "We sent a link to … You sign in with … until you open it.", after a change is asked for. */
  emailPending(): Locator {
    return this.section('Email').getByRole('status');
  }

  /** The Password section's "Current password". */
  currentPassword(): Locator {
    return this.section('Password').getByLabel(/^Current password/);
  }

  newPassword(): Locator {
    return this.section('Password').getByLabel(/^New password/);
  }

  /** The banner after a confirmed email change: "Email changed. You now sign in with …". */
  emailChangedBanner(): Locator {
    return this.page.getByRole('status').filter({ hasText: /^Email changed/ });
  }

  /** "Off" or "On", the badge in the Two-step sign-in section. */
  twoStepStatus(): Locator {
    return this.section('Two-step sign-in').locator('.form-section__lead .badge');
  }

  turnOffTwoStepButton(): Locator {
    return this.section('Two-step sign-in').getByRole('button', { name: 'Turn off' });
  }

  newRecoveryCodesButton(): Locator {
    return this.section('Two-step sign-in').getByRole('button', { name: 'New recovery codes' });
  }

  turnOnTwoStepLink(): Locator {
    return this.section('Two-step sign-in').getByRole('link', { name: 'Turn on two-step sign-in' });
  }

  /** "Bookings and payments", always on. */
  alwaysOnChoice(): Locator {
    return this.section('Email preferences').getByRole('checkbox').first();
  }

  /** "New artists near my church": the marketing choice. */
  marketingChoice(): Locator {
    return this.section('Email preferences').getByRole('checkbox', {
      name: /^New artists near my church/,
    });
  }

  /** The Signed-in devices list (docs/specs/components/list, device variant). */
  deviceList(): Locator {
    return this.section('Signed-in devices').locator('.device-list');
  }

  /** Each device's name, in list order: "Chrome on Windows". */
  deviceNames(): Locator {
    return this.deviceList().locator('li strong');
  }

  /** The line under a device: "Burlington, ON · This device · active now". */
  deviceDetail(device: string): Locator {
    return this.deviceRow(device).locator('.text-muted');
  }

  deviceRow(device: string): Locator {
    return this.deviceList()
      .getByRole('listitem')
      .filter({ has: this.page.locator('strong', { hasText: device }) });
  }

  /** "End session on Safari on iPhone". */
  endSessionButton(device: string): Locator {
    return this.section('Signed-in devices').getByRole('button', {
      name: `End session on ${device}`,
    });
  }

  contactPhone(): Locator {
    return this.section('Contact').getByRole('textbox', { name: /^Contact phone/ });
  }

  /** The help line or error a field points to with aria-describedby. */
  async descriptionOf(field: Locator): Promise<string> {
    const ids = (await field.getAttribute('aria-describedby'))?.split(/\s+/) ?? [];
    const texts = await Promise.all(ids.map((id) => this.page.locator(`[id="${id}"]`).innerText()));
    return texts.join(' ');
  }

  /** The inline error under a field. */
  errorFor(field: Locator): Locator {
    return field.locator('xpath=ancestor::*[contains(@class,"field")][1]').locator('.field__error');
  }

  errorSummary(): Locator {
    return this.page.locator('.error-summary');
  }

  errorSummaryTitle(): Locator {
    return this.errorSummary().getByRole('heading');
  }

  errorSummaryLinks(): Locator {
    return this.errorSummary().getByRole('link');
  }

  /** The save bar's status line: "Saved just now", "Saving…". */
  status(): Locator {
    return this.page.locator('.form-actions').getByRole('status');
  }

  saveButton(): Locator {
    return this.page
      .locator('.form-actions')
      .getByRole('button', { name: /^(Save changes|Saving…)/ });
  }

  discardButton(): Locator {
    return this.page.locator('.form-actions').getByRole('button', { name: 'Discard' });
  }

  /** The "Saved" banner after a save. */
  savedBanner(): Locator {
    return this.page
      .getByRole('status')
      .filter({ hasText: /^Saved/ })
      .filter({ has: this.page.locator('.banner__text') });
  }

  dismissSavedBanner(): Locator {
    return this.savedBanner().getByRole('button', { name: 'Dismiss message' });
  }

  /** "We couldn’t save your changes" above the form, or "We couldn’t load your settings". */
  alert(): Locator {
    return this.page.locator('.page-body .alert');
  }

  alertTitle(): Locator {
    return this.alert().locator('.alert__title');
  }

  tryAgainButton(): Locator {
    return this.alert().getByRole('button', { name: 'Try again' });
  }

  backToDiscoverLink(): Locator {
    return this.alert().getByRole('link', { name: 'Back to Discover' });
  }

  async followSettingsLink(name: string): Promise<void> {
    await this.settingsNav().getByRole('link', { name }).click();
  }
}
