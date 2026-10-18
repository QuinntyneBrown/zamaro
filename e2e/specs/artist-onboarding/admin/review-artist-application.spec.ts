import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../../fixtures/admin-session';
import { ApplicationsPage } from '../../../pages/admin/applications.page';

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
