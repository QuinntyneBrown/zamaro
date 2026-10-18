import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../../fixtures/admin-session';
import { ApplicationPage } from '../../../pages/admin/application.page';
import { ApplicationsPage } from '../../../pages/admin/applications.page';
import { RejectApplicationDialog } from '../../../pages/admin/reject-application.dialog';

// L2-048.1, L2-066, L2-067.1, L2-105 (review-artist-application): the queue of Submitted
// applications, oldest first, as Priya sees it. Deciding an application changes the seed, so that
// lives in review-artist-application.mutation.spec.ts; this suite always sees the three seeded ones.
test.describe('The application queue', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('lists the submitted applications, oldest first, each with a Review link', async ({
    page,
  }) => {
    const applications = new ApplicationsPage(page);

    await applications.open();
    await applications.waitForRows();

    await expect(applications.overline()).toHaveText('Admin · Artist onboarding');
    await expect(applications.subtitle()).toHaveText('3 waiting · we reply within 3 business days');
    await expect(applications.caption()).toHaveText('Submitted, oldest first');
    await expect(applications.headers()).toHaveText([
      'Applicant',
      'Act',
      'Base city',
      'Submitted',
      'Actions',
    ]);
    await expect(applications.rows()).toHaveCount(3);

    const ebenezer = applications.row(0);
    await expect(ebenezer.applicantLink()).toHaveText('Ebenezer Brass Band');
    await expect(ebenezer.act()).toHaveText('Band');
    await expect(ebenezer.city()).toHaveText('Oshawa, ON');
    await expect(ebenezer.submitted()).toHaveText('Tue 6 Oct, 4:20 p.m.');
    await expect(ebenezer.reviewLink()).toHaveAccessibleName(
      'Review Ebenezer Brass Band’s application',
    );

    const kezia = applications.row(1);
    await expect(kezia.applicantLink()).toHaveText('Kezia & Mark Thompson');
    await expect(kezia.act()).toHaveText('Duo');
    await expect(kezia.city()).toHaveText('Pickering, ON');
    await expect(kezia.submitted()).toHaveText('Thu 8 Oct, 9:05 p.m.');

    const tobi = applications.row(2);
    await expect(tobi.applicantLink()).toHaveText('Tobi Adeyemi');
    await expect(tobi.act()).toHaveText('Solo');
    await expect(tobi.city()).toHaveText('Scarborough, ON');
    await expect(tobi.submitted()).toHaveText('Fri 9 Oct, 10:42 a.m.');
    const href = await tobi.reviewLink().getAttribute('href');
    expect(href).toMatch(/^\/admin\/applications\/\d+$/);
    await expect(tobi.applicantLink()).toHaveAttribute('href', href ?? '');
  });

  test('with nothing waiting it says so and points to the artists', async ({ page }) => {
    const applications = new ApplicationsPage(page);
    await applications.answerNoApplications();

    await applications.open();

    await expect(applications.subtitle()).toHaveText('Nothing waiting');
    await expect(applications.emptyStamp()).toHaveText('All caught up');
    await expect(applications.emptyTitle()).toHaveText('No applications waiting');
    await expect(applications.emptyBody()).toContainText(
      'New applications from the Apply as an artist form land here, oldest first.',
    );
    await expect(applications.openArtistsLink()).toHaveAttribute('href', '/admin/artists');
    await expect(applications.table()).toHaveCount(0);
  });

  test('while loading the table shows skeleton rows; a failure offers Try again', async ({
    page,
  }) => {
    const applications = new ApplicationsPage(page);
    await applications.holdApplications();
    await applications.open();

    expect(await applications.isBusy()).toBe(true);
    await expect(applications.skeletonRows()).toHaveCount(3);
    await expect(applications.subtitle()).toHaveAttribute('role', 'status');

    await applications.failApplications();
    await applications.open();

    await expect(applications.errorTitle()).toHaveText('We couldn’t load the applications');
    await expect(applications.errorAlert()).toContainText(
      'Nothing has changed: every application is still Submitted.',
    );
    await expect(applications.subtitle()).toHaveText('We reply within 3 business days');
    await expect(applications.table()).toHaveCount(0);

    await applications.answerNormally();
    await applications.tryAgainButton().click();

    await applications.waitForRows();
    await expect(applications.rows()).toHaveCount(3);
  });
});

/** Tobi Adeyemi's A-0219: the third seeded application. */
const TOBI_ID = 3;

// L2-067.1, L2-048.1, L2-079.2, L2-105 (review-artist-application): the review screen shows every
// applicant detail, the references with their contacts and ticks, the video, the check, and the
// decision panel with Approve locked until both references are verified.
test.describe('The application review screen', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test("shows Tobi's details, bio, video, references and check, with Approve locked", async ({
    page,
  }) => {
    const application = new ApplicationPage(page);

    await application.open(TOBI_ID);

    await expect(application.crumbs()).toHaveText(['Applications', 'Tobi Adeyemi']);
    await expect(application.applicationsCrumb()).toHaveAttribute('href', '/admin/applications');
    await expect(application.overline()).toHaveText('Application A-0219');
    await expect(application.heading()).toHaveText('Tobi Adeyemi');
    await expect(application.subtitle()).toHaveText(
      'Solo vocalist · Acoustic, Hymns · Scarborough, ON · submitted Fri 9 Oct, 10:42 a.m.',
    );
    await expect(application.headBadge()).toHaveText('Submitted');

    await expect(application.detailTerms()).toHaveText([
      'Name',
      'Email',
      'Act type',
      'Base city',
      'Styles',
      '“From” price',
      'Drives up to',
      'Submitted',
    ]);
    await expect(application.detail('Email')).toHaveText('tobi@tobiadeyemi.ca');
    await expect(application.detail('Act type')).toHaveText('Solo');
    await expect(application.detail('Styles')).toHaveText('Solo vocalist, Acoustic, Hymns');
    await expect(application.detail('“From” price')).toHaveText('$400 per service');
    await expect(application.detail('Drives up to')).toHaveText('80 km');
    await expect(application.detail('Submitted')).toHaveText('Fri 9 Oct 2026, 10:42 a.m.');

    await expect(application.bioCaption()).toHaveText('336 characters');
    await expect(application.bio()).toContainText('vocalist and keys player from Scarborough');
    await expect(application.videosCaption()).toHaveText('1 uploaded');
    await expect(application.videos()).toHaveCount(1);
    await expect(application.videos().first()).toContainText('Way Maker — live at Cornerstone');
    await expect(application.videos().first().getByRole('button')).toHaveAccessibleName(
      'Play Way Maker, live at Cornerstone, 5 minutes 48 seconds',
    );

    await expect(application.referencesCaption()).toHaveText('0 of 2 verified');
    const samuel = application.reference(0);
    await expect(samuel.detail('Name')).toHaveText('Pastor Samuel Osei');
    await expect(samuel.detail('Church')).toHaveText('Cornerstone Baptist, Scarborough');
    await expect(samuel.detail('Phone or email')).toHaveText('samuel.osei@cornerstonebaptist.ca');
    await expect(samuel.verifiedBox()).not.toBeChecked();
    await expect(samuel.description()).toHaveText(
      'Call or email them, then tick when they vouch for Tobi.',
    );
    const ruth = application.reference(1);
    await expect(ruth.detail('Name')).toHaveText('Ruth Kim');
    await expect(ruth.detail('Phone or email')).toHaveText('647 555 0192');

    await expect(application.check()).toContainText('No Vulnerable Sector Check uploaded.');
    await expect(application.check()).toContainText(
      'Not needed to approve. Tobi can upload one later; without a verified check Tobi is left out of Youth event searches.',
    );

    await expect(application.approveHelp()).toHaveText(
      'Verify both references before you approve.',
    );
    await expect(application.approveButton()).toHaveText('Approve Tobi');
    await expect(application.approveButton()).toBeDisabled();
    await expect(application.approveButton()).toHaveAttribute('aria-describedby', /.+/);
    await expect(application.rejectButton()).toBeVisible();
    await expect(application.decision()).toContainText(
      'Tobi is emailed either way. Approval grants the Artist role; the profile goes live after payout setup.',
    );
  });

  test('with both references verified, Approve is unlocked', async ({ page }) => {
    const application = new ApplicationPage(page);
    await application.answerVerified(TOBI_ID);

    await application.open(TOBI_ID);

    await expect(application.referencesCaption()).toHaveText('2 of 2 verified');
    await expect(application.reference(0).verifiedBox()).toBeChecked();
    await expect(application.reference(0).description()).toHaveText(
      'Verified by Priya Nair, Fri 9 Oct, 1:50 p.m.',
    );
    await expect(application.reference(1).description()).toHaveText(
      'Verified by Priya Nair, Fri 9 Oct, 2:05 p.m.',
    );
    await expect(application.approveHelp()).toHaveText('Both references verified.');
    await expect(application.approveButton()).toBeEnabled();
  });

  test('while loading it shows skeleton panels; a failure offers Try again and the way back', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    await application.holdApplication(TOBI_ID);
    await application.open(TOBI_ID);

    expect(await application.isBusy()).toBe(true);
    await expect(application.heading()).toHaveText('Application');
    await expect(application.crumbs()).toHaveText(['Applications', 'Loading']);
    await expect(application.loadingStatus()).toContainText('Loading the application');

    await application.failApplication(TOBI_ID);
    await application.open(TOBI_ID);

    await expect(application.errorTitle()).toHaveText('We couldn’t load this application');
    await expect(application.errorAlert()).toContainText(
      'The application and its reference ticks are safe. Try again, or go back to the queue.',
    );
    await expect(application.backToApplicationsLink()).toHaveAttribute(
      'href',
      '/admin/applications',
    );

    await application.answerNormally();
    await application.tryAgainButton().click();

    await expect(application.heading()).toHaveText('Tobi Adeyemi');
    await expect(application.headBadge()).toHaveText('Submitted');
  });
});

// L2-048.2, L2-101 (review-artist-application): the reject dialog needs a reason before anything
// is sent, counts the note, and gives focus back to Reject when it closes. Rejecting lives in the
// mutation suite.
test.describe('The reject dialog', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('asks for a reason first, counts the note, and returns focus to Reject on Cancel', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    const dialog = new RejectApplicationDialog(page);
    await application.open(TOBI_ID);

    await application.rejectButton().click();

    await expect(dialog.heading()).toHaveText('Reject Tobi Adeyemi’s application?');
    await expect(dialog.kicker()).toHaveText('A-0219 · Submitted · Fri 9 Oct');
    await expect(dialog.description()).toHaveText(
      'Tobi is emailed the reason and your note. The application closes as Rejected.',
    );
    await expect(dialog.reason()).toBeFocused();
    await expect(dialog.reason().locator('option')).toHaveText([
      'Choose a reason',
      'References could not be confirmed',
      'Videos don’t show you leading worship',
      'Outside the Zamaro service area',
      'Application incomplete or inaccurate',
      'Other',
    ]);
    await expect(dialog.noteCounter()).toHaveText('0 / 1,000');

    await dialog.note().fill('Please apply again with a Sunday service video.');
    await expect(dialog.noteCounter()).toHaveText('47 / 1,000');

    // Nothing is sent without a reason: the summary names the field and links to it.
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') requests.push(request.url());
    });
    await dialog.rejectButton().click();
    await expect(dialog.errorSummaryTitle()).toHaveText('Choose a reason first');
    await expect(dialog.errorSummaryLinks()).toHaveText(['Choose the reason Tobi will read']);
    await expect(dialog.reasonError()).toHaveText('Choose a reason from the list.');
    await expect(dialog.reason()).toHaveAttribute('aria-invalid', 'true');
    expect(requests.filter((url) => url.endsWith('/rejection'))).toHaveLength(0);

    await dialog.cancelButton().click();

    await expect(dialog.dialog()).toHaveCount(0);
    await expect(application.rejectButton()).toBeFocused();
    await expect(application.headBadge()).toHaveText('Submitted');
  });
});
