import { expect, test } from '@playwright/test';
import { signInAsAdministrator } from '../../fixtures/admin-session';
import { apiJson } from '../../fixtures/api';
import { ArtistPage } from '../../pages/admin/artist.page';
import { ArtistsPage } from '../../pages/admin/artists.page';
import { ChecksPage } from '../../pages/admin/checks.page';

// Seeded ids (CastSeeder inserts the cast in a fixed order after migrate:fresh).
const ABIGAIL_ID = 1;
const MARCUS_ID = 2;
const ELIJAH_ID = 5;

// L2-049.2, L2-049.4, L2-067, L2-105 (verify-vulnerable-sector-check, suspend-and-reinstate-artists
// D18): the check queue and the read-only Artists section. Verifying lives in the admin-mutations
// project (verify-vulnerable-sector-check.mutation.spec.ts) so this suite always sees the seed.
test.describe('The Vulnerable Sector Check queue', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('lists the checks waiting, oldest first, with what each one replaces', async ({ page }) => {
    const checks = new ChecksPage(page);

    await checks.open();
    await checks.waitForRows();

    await expect(checks.artistsCrumb()).toHaveAttribute('href', '/admin/artists');
    await expect(checks.subtitle()).toHaveText(
      '2 waiting · a verified check counts for 3 years from its issue date',
    );
    await expect(checks.caption()).toHaveText('Waiting for verification, oldest first');
    await expect(checks.headers()).toHaveText(['Artist', 'Issued', 'Uploaded', 'Check', 'Actions']);
    await expect(checks.rows()).toHaveCount(2);

    const elijah = checks.row(0);
    await expect(elijah.artistLink()).toHaveText('Elijah Park');
    await expect(elijah.artistLink()).toHaveAttribute('href', `/admin/artists/${ELIJAH_ID}`);
    await expect(elijah.issued()).toHaveText('Fri 25 Sep 2026');
    await expect(elijah.uploaded()).toHaveText('Wed 7 Oct, 4:10 p.m.');
    await expect(elijah.check()).toHaveText('First check');
    await expect(elijah.viewDocumentButton()).toHaveAccessibleName(
      'View document of Elijah Park’s check (opens in a new tab)',
    );
    await expect(elijah.verifyButton()).toHaveAccessibleName('Verify Elijah Park’s check');

    const abigail = checks.row(1);
    await expect(abigail.artistLink()).toHaveText('Abigail Mensah');
    await expect(abigail.artistLink()).toHaveAttribute('href', `/admin/artists/${ABIGAIL_ID}`);
    await expect(abigail.issued()).toHaveText('Mon 5 Oct 2026');
    await expect(abigail.uploaded()).toHaveText('Fri 9 Oct, 9:52 a.m.');
    await expect(abigail.check()).toHaveText('Replaces the check verified until Fri 3 Mar 2028');
  });

  test('View document opens the signed link on the media host in a new tab', async ({ page }) => {
    const checks = new ChecksPage(page);
    await checks.open();
    await checks.waitForRows();

    const { url, tabs } = await checks.viewDocument(checks.rowFor('Elijah Park'));

    expect(tabs).toBe(2);
    const opened = new URL(url);
    expect(opened.hostname).toBe('media.localhost');
    expect(opened.pathname).toMatch(/^\/documents\/[0-9a-f]+$/);
    expect(opened.searchParams.get('signature')).toBeTruthy();
    expect(opened.searchParams.get('expires')).toBeTruthy();
  });

  test('with nothing waiting it says so and points to the artists', async ({ page }) => {
    const checks = new ChecksPage(page);
    await checks.answerNoChecks();

    await checks.open();

    await expect(checks.subtitle()).toHaveText('Nothing waiting');
    await expect(checks.emptyStamp()).toHaveText('All caught up');
    await expect(checks.emptyTitle()).toHaveText('No checks waiting');
    await expect(checks.emptyBody()).toContainText(
      'Artists upload a Vulnerable Sector Check from their profile editor. Each one lands here after its malware scan, oldest first.',
    );
    await expect(checks.openArtistsLink()).toHaveAttribute('href', '/admin/artists');
    await expect(checks.table()).toHaveCount(0);
  });

  test('while loading the table shows skeleton rows; a failure offers Try again', async ({
    page,
  }) => {
    const checks = new ChecksPage(page);
    await checks.holdChecks();
    await checks.open();

    await expect(checks.subtitle()).toHaveText('Loading checks');
    expect(await checks.isBusy()).toBe(true);
    await expect(checks.skeletonRows()).not.toHaveCount(0);

    await checks.answerNormally();
    await checks.failChecks();
    await checks.open();

    await expect(checks.subtitle()).toHaveText(
      'A verified check counts for 3 years from its issue date',
    );
    await expect(checks.errorTitle()).toHaveText('We couldn’t load the checks');
    await expect(checks.errorAlert()).toContainText(
      'Nothing has changed: every check is still waiting. Try again in a moment.',
    );
    await checks.answerNormally();
    await checks.tryAgainButton().click();
    await checks.waitForRows();
  });
});

test.describe('The Artists list', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('counts every artist, links to the check queue and lists them A to Z', async ({ page }) => {
    const artists = new ArtistsPage(page);

    await artists.open();
    await artists.waitForRows();

    await expect(artists.overline()).toHaveText('Admin · Artist management');
    // The whole cast is listed, so the counts are the seed's, not the mock's "8 artists".
    const counts = await apiJson<{
      meta: { total: number; approved: number; suspended: number };
    }>(page.request, '/api/v1/admin/artists');
    expect(counts.meta.suspended).toBe(1);
    await expect(artists.subtitle()).toHaveText(
      `${counts.meta.total} artists · ${counts.meta.approved} approved · 1 suspended`,
    );
    await expect(artists.checksLink()).toHaveText('Vulnerable Sector Checks · 2 waiting');
    await expect(artists.checksLink()).toHaveAttribute('href', '/admin/vulnerable-sector-checks');
    await expect(artists.searchField()).toHaveValue('');
    await expect(artists.searchHelp()).toHaveText('Name, city or email');
    await expect(artists.caption()).toHaveText('All artists, A to Z');
    await expect(artists.headers()).toHaveText([
      'Artist',
      'Act',
      'Base city',
      'Rating',
      'Status',
      'Actions',
    ]);
    await expect(artists.rows()).toHaveCount(counts.meta.total);

    const abigail = artists.row(0);
    await expect(abigail.nameLink()).toHaveText('Abigail Mensah');
    await expect(abigail.nameLink()).toHaveAttribute('href', `/admin/artists/${ABIGAIL_ID}`);
    await expect(abigail.act()).toHaveText('Solo');
    await expect(abigail.city()).toHaveText('Brampton, ON');
    await expect(abigail.ratingImage()).toHaveAccessibleName('Rated 4.9 out of 5');
    await expect(abigail.ratingImage()).toHaveText('★ 4.9');
    await expect(abigail.status()).toHaveText('Approved');
    await expect(abigail.openLink()).toHaveAccessibleName('Open Abigail Mensah');
    await expect(abigail.openLink()).toHaveAttribute('href', `/admin/artists/${ABIGAIL_ID}`);

    await expect(artists.rowFor('Miriam Haile').rating()).toHaveText('No reviews yet');
    await expect(artists.rowFor('Selah Brooks').status()).toHaveText('Suspended');
  });

  test('a search with no match says applicants are not artists; a match narrows the list', async ({
    page,
  }) => {
    const artists = new ArtistsPage(page);
    await artists.open();
    await artists.waitForRows();

    await artists.search('Tobi');

    expect(artists.address()).toBe('/admin/artists?q=Tobi');
    await expect(artists.noResultsTitle()).toHaveText('No artists match “Tobi”');
    await expect(artists.noResults()).toContainText(
      'Only approved and suspended artists are listed here. Someone who has applied and is not approved yet is under Applications.',
    );
    await expect(artists.openApplicationsLink()).toHaveAttribute('href', '/admin/applications');
    await expect(artists.table()).toHaveCount(0);

    await artists.clearSearch();

    await artists.waitForRows();
    await expect(artists.searchField()).toHaveValue('');
    expect(artists.address()).toBe('/admin/artists');

    await artists.search('okonkwo');

    await expect(artists.rows()).toHaveCount(1);
    await expect(artists.row(0).nameLink()).toHaveText('Daniel & Ruth Okonkwo');
    await expect(artists.caption()).toHaveText('Artists matching “okonkwo”, A to Z');
  });

  test('while loading the table shows skeleton rows; a failure offers Try again', async ({
    page,
  }) => {
    const artists = new ArtistsPage(page);
    await artists.holdArtists();
    await artists.open();

    await expect(artists.subtitle()).toHaveText('Loading artists');
    expect(await artists.isBusy()).toBe(true);
    await expect(artists.skeletonRows()).not.toHaveCount(0);

    await artists.answerNormally();
    await artists.failArtists();
    await artists.open();

    await expect(artists.errorTitle()).toHaveText('We couldn’t load the artists');
    await expect(artists.errorAlert()).toContainText(
      'No artist has changed. Try again in a moment.',
    );
    await artists.answerNormally();
    await artists.tryAgainButton().click();
    await artists.waitForRows();
  });
});

test.describe('An artist', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdministrator(page.context());
  });

  test('shows the account, the profile, the upcoming bookings and a read-only standing', async ({
    page,
  }) => {
    const artists = new ArtistsPage(page);
    const artist = new ArtistPage(page);
    await artists.open();
    await artists.waitForRows();

    await artists.rowFor('Marcus Bell Trio').openLink().click();

    await expect(artist.heading()).toHaveText('Marcus Bell Trio');
    await expect(artist.crumbs()).toHaveText(['Artists', 'Marcus Bell Trio']);
    await expect(artist.artistsCrumb()).toHaveAttribute('href', '/admin/artists');
    await expect(artist.overline()).toHaveText('Artist · approved Mon 2 Mar 2026');
    await expect(artist.subtitle()).toHaveText('Band · Acoustic, Hymns · Hamilton, ON');
    await expect(artist.headBadge()).toHaveText('Approved');

    await expect(artist.detailTerms()).toHaveText([
      'Account email',
      'Act type',
      'Base city',
      '“From” price',
      'Rating',
      'Profile address',
    ]);
    await expect(artist.detail('Account email')).toHaveText('marcus@marcusbelltrio.ca');
    await expect(artist.detail('Act type')).toHaveText('Band');
    await expect(artist.detail('Base city')).toHaveText('Hamilton, ON');
    await expect(artist.detail('“From” price')).toHaveText('$950 per service');
    await expect(artist.detail('Rating').getByRole('img')).toHaveAccessibleName(
      'Rated 4.6 out of 5',
    );
    await expect(artist.detail('Profile address')).toHaveText('zamaro.ca/artists/marcus-bell-trio');

    // Marcus's one confirmed booking this season (CastSeeder).
    await expect(artist.bookings()).toHaveCount(1);
    const booking = artist.booking(0);
    expect(await booking.day()).toBe('Sun 25 Oct');
    await expect(booking.title()).toHaveText('ZAM-0097 · Riverside Community Church');
    await expect(booking.note()).toHaveText('Burlington · Sunday service');
    await expect(booking.stamp()).toHaveText('Confirmed');

    await expect(artist.history()).toContainText('Never suspended.');
    await expect(artist.standingBadge()).toHaveText('Approved');
    // Suspend and reinstate come with M8 (D18): the standing is read only.
    await expect(artist.standingButtons()).toHaveCount(0);
  });

  test('while loading the page shows skeletons; a failure offers Try again and the list', async ({
    page,
  }) => {
    const artist = new ArtistPage(page);
    await artist.holdArtist(MARCUS_ID);
    await artist.open(MARCUS_ID);

    await expect(artist.heading()).toHaveText('Artist');
    await expect(artist.crumbs()).toHaveText(['Artists', 'Loading']);
    await expect(artist.loadingStatus()).toHaveText('Loading the artist');
    expect(await artist.isBusy()).toBe(true);

    await artist.answerNormally();
    await artist.failArtist(MARCUS_ID);
    await artist.open(MARCUS_ID);

    await expect(artist.errorTitle()).toHaveText('We couldn’t load this artist');
    await expect(artist.errorAlert()).toContainText(
      'Their standing has not changed. Try again, or go back to the list.',
    );
    await expect(artist.backToArtistsLink()).toHaveAttribute('href', '/admin/artists');
    await artist.answerNormally();
    await artist.tryAgainButton().click();
    await expect(artist.heading()).toHaveText('Marcus Bell Trio');
  });
});
