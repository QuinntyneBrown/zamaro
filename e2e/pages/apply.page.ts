import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock } from '../fixtures/clock';
import { Shell } from './shell';

/** The bytes an MP4 starts with; the e2e API's fake transcoder reads any such file as 5:48 long. */
const MP4_HEAD = Buffer.from('\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom', 'binary');

export type ApplyStep = 'About you' | 'Your music' | 'Price and travel' | 'References and review';

export interface Reference {
  name: string;
  church: string;
  contact: string;
}

/**
 * Apply as an artist at `/artists/apply` (docs/mocks/pages/apply): four steps under a stepper, each
 * a form named by its title, then "Application received".
 */
export class ApplyPage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(): Promise<void> {
    await freezeClock(this.page);
    await this.page.goto('/artists/apply', { waitUntil: 'networkidle' });
    await expect(this.heading()).toHaveText('Apply as an artist');
  }

  /** The path in the address bar. */
  path(): string {
    return new URL(this.page.url()).pathname;
  }

  overline(): Locator {
    return this.page.locator('.page-head .overline');
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  subtitle(): Locator {
    return this.page.locator('.page-head__sub');
  }

  // The stepper.

  stepper(): Locator {
    return this.page.getByRole('list', { name: 'Application steps' });
  }

  steps(): Locator {
    return this.stepper().getByRole('listitem');
  }

  currentStep(): Locator {
    return this.stepper().locator('[aria-current="step"]');
  }

  /** A done step's link back, named "About you, done". */
  stepLink(step: ApplyStep): Locator {
    return this.stepper().getByRole('link', { name: `${step}, done` });
  }

  /** Every step's state: "current", "done", "invalid" or "upcoming", in order. */
  async stepStates(): Promise<string[]> {
    return this.steps().evaluateAll((items) =>
      items.map((item) =>
        item.getAttribute('aria-current') === 'step'
          ? 'current'
          : (item.getAttribute('data-state') ?? 'upcoming'),
      ),
    );
  }

  // The step form.

  form(): Locator {
    return this.page.locator('main').getByRole('form');
  }

  stepTitle(): Locator {
    return this.form().locator('#step-title');
  }

  /** "Step 1 of 4 · Saved on this device". */
  status(): Locator {
    return this.form().locator('.form-actions__status');
  }

  continueButton(): Locator {
    return this.form().getByRole('button', { name: 'Continue' });
  }

  backLink(): Locator {
    return this.form().getByRole('link', { name: 'Back' });
  }

  sendButton(): Locator {
    return this.form().getByRole('button', { name: /^Send/ });
  }

  async continue(): Promise<void> {
    await this.continueButton().click();
  }

  // Step 1: About you.

  fullName(): Locator {
    return this.form().getByRole('textbox', { name: /^Full name/ });
  }

  email(): Locator {
    return this.form().getByRole('textbox', { name: /^Email/ });
  }

  baseCity(): Locator {
    return this.form().getByRole('textbox', { name: /^Base city/ });
  }

  actType(name: string): Locator {
    return this.form()
      .getByRole('group', { name: /^Act type/ })
      .getByRole('radio', { name });
  }

  async fillAboutYou(about: {
    name: string;
    email: string;
    city: string;
    act: string;
  }): Promise<void> {
    await this.fullName().fill(about.name);
    await this.email().fill(about.email);
    await this.baseCity().fill(about.city);
    await this.actType(about.act).check();
  }

  // Step 2: Your music.

  style(name: string): Locator {
    return this.form()
      .getByRole('group', { name: /^Styles/ })
      .getByRole('checkbox', { name });
  }

  bio(): Locator {
    return this.form().getByRole('textbox', { name: /^Bio/ });
  }

  /** "100 to 1,500 characters. 336 so far." */
  bioHelp(): Locator {
    return this.form().locator('#bio-help');
  }

  videoTitle(): Locator {
    return this.form().getByRole('textbox', { name: /^Title for your next video/ });
  }

  videoFile(): Locator {
    return this.form().getByLabel(/^Add a video/);
  }

  uploadedVideos(): Locator {
    return this.form().getByRole('list', { name: 'Uploaded videos' }).getByRole('listitem');
  }

  /** The row's facts: "way-maker.mp4 · 0.3 MB · 5:48 · Live". */
  uploadedVideoFacts(index: number): Locator {
    return this.uploadedVideos().nth(index).locator('.upload-list__text > span');
  }

  uploadedVideoTitle(index: number): Locator {
    return this.uploadedVideos().nth(index).locator('.upload-list__text > strong');
  }

  uploadProgress(): Locator {
    return this.form().getByRole('progressbar');
  }

  /** Titles the next video and picks a small MP4 for it; the row shows percent, then Processing, then Live. */
  async uploadVideo(title: string, fileName: string, bytes = 300_000): Promise<void> {
    await this.videoTitle().fill(title);
    await this.videoFile().setInputFiles({
      name: fileName,
      mimeType: 'video/mp4',
      buffer: Buffer.concat([MP4_HEAD, Buffer.alloc(Math.max(0, bytes - MP4_HEAD.length))]),
    });
  }

  // Step 3: Price and travel.

  price(): Locator {
    return this.form().getByRole('spinbutton', { name: /^“From” price/ });
  }

  distance(): Locator {
    return this.form().getByRole('combobox', { name: /^Maximum driving distance/ });
  }

  distanceHelp(): Locator {
    return this.form().locator('#distance-help');
  }

  // Step 4: References and review.

  private referenceGroup(index: 1 | 2): Locator {
    return this.form().getByRole('group', { name: `Reference ${index}` });
  }

  referenceName(index: 1 | 2): Locator {
    return this.referenceGroup(index).getByRole('textbox', { name: /^Name/ });
  }

  referenceChurch(index: 1 | 2): Locator {
    return this.referenceGroup(index).getByRole('textbox', { name: /^Church/ });
  }

  referenceContact(index: 1 | 2): Locator {
    return this.referenceGroup(index).getByRole('textbox', { name: /^Phone or email/ });
  }

  async fillReference(index: 1 | 2, reference: Reference): Promise<void> {
    await this.referenceName(index).fill(reference.name);
    await this.referenceChurch(index).fill(reference.church);
    await this.referenceContact(index).fill(reference.contact);
  }

  /** A review panel's value by its term: reviewValue('About you', 'Email'). */
  reviewValue(section: string, term: string): Locator {
    return this.reviewPanel(section)
      .locator('.definition__row')
      .filter({ has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }

  editLink(section: string): Locator {
    return this.reviewPanel(section).getByRole('link', { name: /^Edit/ });
  }

  private reviewPanel(section: string): Locator {
    return this.form()
      .locator('.panel')
      .filter({ has: this.page.getByRole('heading', { level: 2, name: section, exact: true }) });
  }

  /** Presses Send application and waits for the API's answer. */
  async send(): Promise<number> {
    const answered = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/v1/artist-applications',
    );
    await this.sendButton().click();
    return (await answered).status();
  }

  // Refusals and retries (M3 S12).

  /** The "Fix n things to continue" summary over the step. */
  errorSummary(): Locator {
    return this.form().locator('.error-summary');
  }

  errorSummaryTitle(): Locator {
    return this.errorSummary().locator('.error-summary__title');
  }

  errorSummaryItems(): Locator {
    return this.errorSummary().getByRole('link');
  }

  /** A field's own error line: fieldError('base-city'). */
  fieldError(fieldId: string): Locator {
    return this.form().locator(`#${fieldId}-error`);
  }

  /** The danger alert over the review step: in review, the bot check, or Zamaro not answering. */
  alert(): Locator {
    return this.form().getByRole('alert');
  }

  alertTitle(): Locator {
    return this.alert().locator('.alert__title');
  }

  /** Forgets the draft on this device and opens the form again, as a new applicant would. */
  async startOver(): Promise<void> {
    await this.page.evaluate(() => sessionStorage.clear());
    await this.open();
  }

  /** Records the Idempotency-Key of every send from now on. */
  recordSends(): string[] {
    const keys: string[] = [];
    this.page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/artist-applications'
      ) {
        keys.push(request.headers()['idempotency-key'] ?? '');
      }
    });
    return keys;
  }

  /** The next send reaches Zamaro, but its answer is lost on the way back, once. */
  async loseTheNextAnswer(): Promise<void> {
    await this.page.route(
      (url) => url.pathname === '/api/v1/artist-applications',
      async (route) => {
        await route.fetch();
        await route.abort('connectionfailed');
      },
      { times: 1 },
    );
  }

  /** Presses Send application when no answer will come back. */
  async sendIntoTheVoid(): Promise<void> {
    const failed = this.page.waitForEvent('requestfailed', (request) =>
      request.url().endsWith('/api/v1/artist-applications'),
    );
    await this.sendButton().click();
    await failed;
  }

  // Application received.

  donePanel(): Locator {
    return this.page.locator('main .panel--raised');
  }

  doneTitle(): Locator {
    return this.donePanel().getByRole('heading', { level: 2 });
  }

  doneStamp(): Locator {
    return this.donePanel().locator('zm-stamp');
  }

  doneLead(): Locator {
    return this.donePanel().locator('.lead');
  }

  /** A receipt value by its term: receipt('Reply by'). */
  receipt(term: string): Locator {
    return this.donePanel()
      .locator('.receipt__row')
      .filter({ has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }

  receiptFine(): Locator {
    return this.donePanel().locator('.receipt__fine');
  }

  timeline(): Locator {
    return this.donePanel().locator('.timeline > li');
  }

  browseLineupLink(): Locator {
    return this.donePanel().getByRole('link', { name: /^Browse the lineup/ });
  }
}
