import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../../fixtures/admin-session';
import { ApplicationPage } from '../../../pages/admin/application.page';
import { ApplicationsPage } from '../../../pages/admin/applications.page';

// Seeded ids (CastSeeder inserts the applications in a fixed order after migrate:fresh).
const EBENEZER_ID = 1;
const KEZIA_ID = 2;
const TOBI_ID = 3;

// L2-066, L2-067.1, L2-079.2, L2-089.3 (review-artist-application): the queue and the review screen.
// Ticking a reference lives in the admin-mutations project (review-artist-application.mutation.spec.ts)
// so this suite always sees the seed.
test.describe('The applications queue', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('lists the submitted applications oldest first, each with Review', async ({ page }) => {
    const applications = new ApplicationsPage(page);
    await applications.showOnlyTheSeededApplications();

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
    await expect(ebenezer.applicantLink()).toHaveAttribute(
      'href',
      `/admin/applications/${EBENEZER_ID}`,
    );
    await expect(ebenezer.act()).toHaveText('Band');
    await expect(ebenezer.city()).toHaveText('Oshawa, ON');
    await expect(ebenezer.submitted()).toHaveText('Tue 6 Oct, 4:20 p.m.');
    await expect(ebenezer.reviewLink()).toHaveAccessibleName(
      'Review Ebenezer Brass Band’s application',
    );
    await expect(ebenezer.reviewLink()).toHaveAttribute(
      'href',
      `/admin/applications/${EBENEZER_ID}`,
    );

    const kezia = applications.row(1);
    await expect(kezia.applicantLink()).toHaveText('Kezia & Mark Thompson');
    await expect(kezia.applicantLink()).toHaveAttribute('href', `/admin/applications/${KEZIA_ID}`);
    await expect(kezia.act()).toHaveText('Duo');
    await expect(kezia.city()).toHaveText('Pickering, ON');
    await expect(kezia.submitted()).toHaveText('Thu 8 Oct, 9:05 p.m.');

    const tobi = applications.row(2);
    await expect(tobi.applicantLink()).toHaveText('Tobi Adeyemi');
    await expect(tobi.act()).toHaveText('Solo');
    await expect(tobi.city()).toHaveText('Scarborough, ON');
    await expect(tobi.submitted()).toHaveText('Fri 9 Oct, 10:42 a.m.');
  });

  test('with nothing waiting it says so, names the last decision and points to the artists', async ({
    page,
  }) => {
    const applications = new ApplicationsPage(page);
    await applications.answerNoApplications('2026-10-05T15:30:00-04:00');

    await applications.open();

    await expect(applications.subtitle()).toHaveText('Nothing waiting');
    await expect(applications.emptyStamp()).toHaveText('All caught up');
    await expect(applications.emptyTitle()).toHaveText('No applications waiting');
    await expect(applications.emptyBody()).toContainText(
      'New applications from the Apply as an artist form land here, oldest first. The last one was decided Mon 5 Oct.',
    );
    await expect(applications.openArtistsLink()).toHaveAttribute('href', '/admin/artists');
  });

  test('while loading the table shows skeleton rows, and a failure offers Try again', async ({
    page,
  }) => {
    const applications = new ApplicationsPage(page);
    await applications.holdApplications();

    await applications.open();

    expect(await applications.isBusy()).toBe(true);
    await expect(applications.loadingStatus()).toHaveText('Loading applications');
    await expect(applications.skeletonRows()).toHaveCount(3);
    await expect(applications.headers()).toHaveText([
      'Applicant',
      'Act',
      'Base city',
      'Submitted',
      'Actions',
    ]);

    await applications.failApplications();
    await page.reload();

    await expect(applications.subtitle()).toHaveText('We reply within 3 business days');
    await expect(applications.errorTitle()).toHaveText('We couldn’t load the applications');
    await expect(applications.errorAlert()).toContainText(
      'Nothing has changed: every application is still Submitted. Try again in a moment.',
    );

    await applications.answerNormally();
    await applications.showOnlyTheSeededApplications();
    await applications.tryAgainButton().click();

    await applications.waitForRows();
    await expect(applications.rows()).toHaveCount(3);
  });
});

test.describe('An application under review', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('shows every applicant detail, the references with their contacts, and a disabled Approve', async ({
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

    await expect(application.applicant('Name')).toHaveText('Tobi Adeyemi');
    await expect(application.applicant('Email')).toHaveText('tobi@tobiadeyemi.ca');
    await expect(application.applicant('Act type')).toHaveText('Solo');
    await expect(application.applicant('Base city')).toHaveText('Scarborough, ON');
    await expect(application.applicant('Styles')).toHaveText('Solo vocalist, Acoustic, Hymns');
    await expect(application.applicant('“From” price')).toHaveText('$400 per service');
    await expect(application.applicant('Drives up to')).toHaveText('80 km');
    await expect(application.applicant('Submitted')).toHaveText('Fri 9 Oct 2026, 10:42 a.m.');

    await expect(application.panelCaption('Bio')).toHaveText('336 characters');
    await expect(application.bio()).toContainText(
      'I’m a vocalist and keys player from Scarborough',
    );

    await expect(application.panelCaption('Videos')).toHaveText('1 uploaded');
    await expect(application.videoCaption(0)).toHaveText('Way Maker — live at Cornerstone');
    await expect(application.videoPlayButton(0)).toHaveAccessibleName(
      'Play Way Maker, live at Cornerstone, 5 minutes 48 seconds',
    );

    await expect(application.panelCaption('Church references')).toHaveText('0 of 2 verified');
    await expect(application.referencesLead()).toHaveText(
      'Both must be verified before approval. Each tick saves at once and is recorded in the audit log.',
    );
    await expect(application.referenceDetail(1, 'Name')).toHaveText('Pastor Samuel Osei');
    await expect(application.referenceDetail(1, 'Church')).toHaveText(
      'Cornerstone Baptist, Scarborough',
    );
    await expect(application.referenceDetail(1, 'Phone or email')).toHaveText(
      'samuel.osei@cornerstonebaptist.ca',
    );
    await expect(application.referenceTick(1)).not.toBeChecked();
    await expect(application.referenceTickDescription(1)).toHaveText(
      'Call or email them, then tick when they vouch for Tobi.',
    );
    await expect(application.referenceDetail(2, 'Name')).toHaveText('Ruth Kim');
    await expect(application.referenceDetail(2, 'Phone or email')).toHaveText('647 555 0192');
    await expect(application.referenceTick(2)).not.toBeChecked();

    await expect(application.vulnerableSectorCheck()).toHaveText(
      'No Vulnerable Sector Check uploaded.',
    );
    await expect(application.vulnerableSectorCheckNote()).toHaveText(
      'Not needed to approve. Tobi can upload one later; without a verified check Tobi is left out of Youth event searches.',
    );

    await expect(application.decisionCode()).toHaveText('A-0219');
    await expect(application.approveHelp()).toHaveText(
      'Verify both references before you approve.',
    );
    await expect(application.approveButton()).toHaveText('Approve Tobi');
    await expect(application.approveButton()).toBeDisabled();
    await expect(application.approveButton()).toHaveAccessibleDescription(
      'Verify both references before you approve.',
    );
    await expect(application.rejectButton()).toBeVisible();
    await expect(application.decisionFine()).toHaveText(
      'Tobi is emailed either way. Approval grants the Artist role; the profile goes live after payout setup.',
    );
  });

  test('while loading it says so, and a failure offers Try again and the way back', async ({
    page,
  }) => {
    const application = new ApplicationPage(page);
    await application.holdApplication(TOBI_ID);

    await application.open(TOBI_ID);

    expect(await application.isBusy()).toBe(true);
    await expect(application.crumbs()).toHaveText(['Applications', 'Loading']);
    await expect(application.overline()).toHaveText('Admin · Artist onboarding');
    await expect(application.heading()).toHaveText('Application');
    await expect(application.loadingStatus()).toHaveText('Loading the application');

    await application.failApplication(TOBI_ID);
    await page.reload();

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
    await expect(application.approveButton()).toBeDisabled();
  });
});
