import { expect, test } from '@playwright/test';
import { uniqueEmail } from '../../fixtures/accounts';
import { waitForEmail } from '../../fixtures/mailbox';
import { ApplyPage, type Reference } from '../../pages/apply.page';

const BIO =
  'I’m a vocalist and keys player from Scarborough, and I’ve led Sunday worship at Cornerstone Baptist for six years. I lead from the piano, so I can carry a service on my own or slot in with your band. My sets mix the hymns your seniors love with newer songs your youth know, and I’m happy to learn what your congregation sings.';

const OSEI: Reference = {
  name: 'Pastor Samuel Osei',
  church: 'Cornerstone Baptist, Scarborough',
  contact: 'samuel.osei@cornerstonebaptist.ca',
};
const KIM: Reference = {
  name: 'Ruth Kim',
  church: 'Agincourt Community Church',
  contact: '647 555 0192',
};

/** Tobi's four steps, with a fresh email because the seed holds his own application (M3 S13). */
async function applyAsTobi(apply: ApplyPage, email: string): Promise<void> {
  await apply.fillAboutYou({ name: 'Tobi Adeyemi', email, city: 'Scarborough', act: 'Solo' });
  await apply.continue();
  await expect(apply.stepTitle()).toHaveText('Your music');
  await apply.style('Solo vocalist').check();
  await apply.style('Acoustic').check();
  await apply.style('Hymns').check();
  await apply.bio().fill(BIO);
  await apply.uploadVideo('Way Maker, live at Cornerstone', 'way-maker.mp4');
  await expect(apply.uploadedVideoFacts(0)).toContainText('Live', { timeout: 30_000 });
  await apply.continue();
  await expect(apply.stepTitle()).toHaveText('Price and travel');
  await apply.price().fill('400');
  await apply.distance().selectOption('80');
  await apply.continue();
  await expect(apply.stepTitle()).toHaveText('Two church references');
  await apply.fillReference(1, OSEI);
  await apply.fillReference(2, KIM);
}

// L2-047.1, L2-047.4, L2-052.2, L2-087, L2-101, L2-102, L2-108 (apply-as-artist): a guest applies in
// four steps, uploads a video, reviews every answer, sends, and reads the number and reply-by date.
test.describe('Apply as an artist', () => {
  test('a guest applies in four steps and is told the number and the reply-by date', async ({
    page,
  }) => {
    const apply = new ApplyPage(page);
    const email = uniqueEmail('tobi');
    await apply.open();

    await expect(apply.overline()).toHaveText('For artists · Free to join');
    await expect(apply.subtitle()).toHaveText('About 10 minutes · We reply within 3 business days');
    await expect(apply.steps()).toHaveText([
      'About you',
      'Your music',
      'Price and travel',
      'References and review',
    ]);
    await expect(apply.currentStep()).toHaveText('About you');
    await expect(apply.fullName()).toBeFocused();
    await expect(apply.status()).toHaveText('Step 1 of 4 · Saved on this device');

    await applyAsTobi(apply, email);

    // The review: every answer, with a way back to its step.
    expect(await apply.stepStates()).toEqual(['done', 'done', 'done', 'current']);
    await expect(apply.bioHelp()).toHaveCount(0);
    await expect(apply.reviewValue('About you', 'Name')).toHaveText('Tobi Adeyemi');
    await expect(apply.reviewValue('About you', 'Email')).toHaveText(email);
    await expect(apply.reviewValue('About you', 'Act type')).toHaveText('Solo');
    await expect(apply.reviewValue('About you', 'Base city')).toHaveText('Scarborough, ON');
    await expect(apply.reviewValue('Your music', 'Styles')).toHaveText(
      'Solo vocalist, Acoustic, Hymns',
    );
    await expect(apply.reviewValue('Your music', 'Bio')).toHaveText(
      '326 characters, starts “I’m a vocalist and keys player from Scarborough…”',
    );
    await expect(apply.reviewValue('Your music', 'Videos')).toHaveText(
      '1 uploaded: Way Maker, live at Cornerstone',
    );
    await expect(apply.reviewValue('Price and travel', 'From price')).toHaveText(
      '$400 per service',
    );
    await expect(apply.reviewValue('Price and travel', 'Drives up to')).toHaveText('80 km');
    await expect(apply.editLink('Your music')).toHaveAttribute('href', '/artists/apply/music');
    await expect(apply.status()).toHaveText('Step 4 of 4 · Nothing is public yet');

    const status = await apply.send();

    expect(status).toBe(201);
    await expect(apply.heading()).toHaveText('Application received');
    await expect(apply.heading()).toBeFocused();
    await expect(apply.overline()).toHaveText('For artists · Submitted');
    await expect(apply.subtitle()).toHaveText(/^Tobi Adeyemi · Application A-\d{4}$/);
    expect(await apply.stepStates()).toEqual(['done', 'done', 'done', 'done']);
    await expect(apply.stepper().getByRole('link')).toHaveCount(0);
    await expect(apply.doneTitle()).toHaveText('Thanks, Tobi');
    await expect(apply.doneStamp()).toHaveText('Submitted');
    await expect(apply.doneLead()).toHaveText(
      `Your application is in, and a confirmation is on its way to ${email}. We review every one by hand and reply by Thu 15 Oct.`,
    );
    await expect(apply.receipt('Application')).toHaveText(/^A-\d{4}$/);
    await expect(apply.receipt('Status')).toHaveText('Submitted');
    await expect(apply.receipt('Sent')).toHaveText('Fri 9 Oct, 10:00 a.m.');
    await expect(apply.receipt('Reply by')).toHaveText('Thu 15 Oct');
    await expect(apply.receiptFine()).toHaveText('3 business days. Monday 12 Oct is Thanksgiving.');
    await expect(apply.timeline()).toHaveText([
      /^Submitted/,
      /^We check both references/,
      /^We review your application/,
      /^Set up payouts, then go live/,
    ]);
    await expect(apply.timeline().nth(1)).toContainText(
      'Pastor Samuel Osei and Ruth Kim, this week.',
    );
    await expect(apply.browseLineupLink()).toHaveAttribute('href', '/');
  });

  test('the confirmation email names the number and the reply-by date', async ({ page }) => {
    const apply = new ApplyPage(page);
    const email = uniqueEmail('tobi');
    await apply.open();
    await applyAsTobi(apply, email);

    await apply.send();

    const number = (await apply.receipt('Application').textContent()) ?? '';
    const confirmation = await waitForEmail(email, `We received your application, ${number}`);
    expect(confirmation.from).toBe('hello@zamaro.ca');
    expect(confirmation.text).toContain('Hi Tobi,');
    expect(confirmation.text).toContain('Thu 15 Oct');
  });

  test('completed steps link back, and every answer is kept on this device', async ({ page }) => {
    const apply = new ApplyPage(page);
    const email = uniqueEmail('tobi');
    await apply.open();
    await apply.fillAboutYou({ name: 'Tobi Adeyemi', email, city: 'Scarborough', act: 'Solo' });
    await apply.continue();

    await expect(apply.stepTitle()).toHaveText('Your music');
    expect(apply.path()).toBe('/artists/apply/music');
    await expect(apply.stepLink('About you')).toHaveAttribute('href', '/artists/apply');
    await expect(apply.backLink()).toHaveAttribute('href', '/artists/apply');
    await expect(apply.status()).toHaveText('Step 2 of 4 · Saved on this device');

    await apply.style('Hymns').check();
    await apply.bio().fill(BIO);
    await expect(apply.bioHelp()).toHaveText('100 to 1,500 characters. 326 so far.');
    await apply.stepLink('About you').click();

    await expect(apply.stepTitle()).toHaveText('About you');
    await expect(apply.fullName()).toHaveValue('Tobi Adeyemi');
    await expect(apply.email()).toHaveValue(email);
    await expect(apply.baseCity()).toHaveValue('Scarborough');
    await expect(apply.actType('Solo')).toBeChecked();

    // Reloading the page keeps the draft; it lives on this device until the application is sent.
    await page.reload({ waitUntil: 'networkidle' });

    await expect(apply.fullName()).toHaveValue('Tobi Adeyemi');
    await apply.continue();
    await expect(apply.style('Hymns')).toBeChecked();
    await expect(apply.bio()).toHaveValue(BIO);
  });

  // L2-047.2, L2-108.3: the two reference problems are named together, and the answers stay.
  test('a missing contact and a reference that is you are named together, then fixed', async ({
    page,
  }) => {
    const apply = new ApplyPage(page);
    const email = uniqueEmail('tobi');
    await apply.open();
    await applyAsTobi(apply, email);
    await apply.referenceContact(1).fill('');
    await apply.referenceContact(2).fill(email.toUpperCase());

    await apply.sendButton().click();

    await expect(apply.errorSummaryTitle()).toHaveText('Fix 2 things to continue');
    await expect(apply.errorSummary()).toBeFocused();
    await expect(apply.errorSummaryItems()).toHaveText([
      'Add a phone number or email so we can reach Pastor Osei.',
      'References must be someone other than you.',
    ]);
    await expect(apply.fieldError('ref2-contact')).toHaveText(
      'References must be someone other than you.',
    );
    await expect(apply.status()).toHaveText('Not sent · 2 things to fix');
    await apply.errorSummaryItems().first().click();
    await expect(apply.referenceContact(1)).toBeFocused();
    await expect(apply.referenceName(1)).toHaveValue(OSEI.name);

    await apply.fillReference(1, OSEI);
    await apply.referenceContact(2).fill(KIM.contact);
    expect(await apply.send()).toBe(201);
    await expect(apply.heading()).toHaveText('Application received');
  });

  // L2-001.3, L2-001.4, L2-075.1, L2-108.3: the server's answer opens the step that holds the field.
  test('a base city outside the area returns to About you, with every answer kept', async ({
    page,
  }) => {
    const apply = new ApplyPage(page);
    const email = uniqueEmail('tobi');
    await apply.open();
    await apply.fillAboutYou({ name: 'Tobi Adeyemi', email, city: 'Ottawa', act: 'Solo' });
    await apply.continue();
    await apply.style('Hymns').check();
    await apply.bio().fill(BIO);
    await apply.uploadVideo('Way Maker, live at Cornerstone', 'way-maker.mp4');
    await expect(apply.uploadedVideoFacts(0)).toContainText('Live', { timeout: 30_000 });
    await apply.continue();
    await apply.price().fill('400');
    await apply.continue();
    await apply.fillReference(1, OSEI);
    await apply.fillReference(2, KIM);

    expect(await apply.send()).toBe(422);

    await expect(apply.stepTitle()).toHaveText('About you');
    expect(apply.path()).toBe('/artists/apply');
    await expect(apply.errorSummaryTitle()).toHaveText('Fix 1 thing to continue');
    await expect(apply.errorSummary()).toBeFocused();
    await expect(apply.errorSummaryItems()).toHaveText([
      'Zamaro serves churches within 200 km of Toronto.',
    ]);
    await expect(apply.fieldError('base-city')).toHaveText(
      'Zamaro serves churches within 200 km of Toronto.',
    );
    await expect(apply.status()).toHaveText('Not sent · 1 thing to fix');
    expect(await apply.stepStates()).toEqual(['current', 'done', 'done', 'done']);
    await expect(apply.baseCity()).toHaveValue('Ottawa');

    await apply.baseCity().fill('Atlantis');
    await apply.continue();
    await expect(apply.bio()).toHaveValue(BIO);
    await apply.continue();
    await expect(apply.price()).toHaveValue('400');
    await apply.continue();
    await expect(apply.referenceName(2)).toHaveValue(KIM.name);
    expect(await apply.send()).toBe(422);
    await expect(apply.fieldError('base-city')).toHaveText(
      'We couldn’t find that address. Check the street and postal code.',
    );

    await apply.baseCity().fill('Scarborough');
    for (let step = 0; step < 3; step++) await apply.continue();
    expect(await apply.send()).toBe(201);
    await expect(apply.reviewValue('About you', 'Base city').or(apply.doneTitle())).toHaveText(
      'Thanks, Tobi',
    );
  });

  // L2-047.3: one pending application per email, compared without case.
  test('an email with an application in review is told so, and keeps the answers', async ({
    page,
  }) => {
    const apply = new ApplyPage(page);
    const email = uniqueEmail('tobi');
    await apply.open();
    await applyAsTobi(apply, email);
    expect(await apply.send()).toBe(201);

    await apply.startOver();
    await applyAsTobi(apply, email.toUpperCase());
    expect(await apply.send()).toBe(409);

    await expect(apply.alertTitle()).toHaveText('You already have an application in review.');
    await expect(apply.alert()).toContainText(
      `We’re reviewing the one you sent from ${email} and will reply there. Your answers here are kept.`,
    );
    await expect(apply.status()).toHaveText('Not sent · answers kept');
    await expect(apply.referenceName(1)).toHaveValue(OSEI.name);
    await expect(apply.reviewValue('About you', 'Email')).toHaveText(email.toUpperCase());
  });

  // L2-047.5, L2-108.1, L2-108.3: the retry carries the same key, so one application exists.
  test('a retry after a lost answer carries the same key and gets the one application', async ({
    page,
  }) => {
    const apply = new ApplyPage(page);
    const email = uniqueEmail('tobi');
    await apply.open();
    await applyAsTobi(apply, email);
    const keys = apply.recordSends();

    await apply.loseTheNextAnswer();
    await apply.sendIntoTheVoid();

    await expect(apply.alertTitle()).toHaveText('We couldn’t send your application');
    await expect(apply.alert()).toContainText(
      'Nothing was sent. Your answers are kept; try again in a moment.',
    );
    await expect(apply.status()).toHaveText('Not sent · answers kept');
    await expect(apply.sendButton()).toBeEnabled();
    await expect(apply.referenceName(2)).toHaveValue(KIM.name);

    // Zamaro did create it: the retry is answered with that application, not a second one.
    expect(await apply.send()).toBe(200);
    await expect(apply.heading()).toHaveText('Application received');
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(keys[1]).toBe(keys[0]);
  });

  test('/artists/apply is the form, never an artist’s profile', async ({ page }) => {
    const apply = new ApplyPage(page);
    const profileRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/v1/artists/apply')
        profileRequests.push(request.url());
    });

    await apply.open();

    await expect(apply.fullName()).toBeVisible();
    expect(profileRequests).toEqual([]);
  });
});
