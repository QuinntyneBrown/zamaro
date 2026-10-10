import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';

// L2-012, L2-013, L2-016, L2-009.2, L2-105 (profile), L2-107.
test.describe('An artist’s profile', () => {
  let profile: ArtistProfilePage;
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
    discover = new DiscoverPage(page);
    await discover.freezeClock();
  });

  async function searchBurlington(): Promise<void> {
    await discover.openLink({
      date: cast.search.date,
      kind: 'worship-night',
      lat: '43.325',
      lng: '-79.799',
      place: 'Burlington',
      radius: '120',
    });
    await expect(discover.lineup.headliner().name()).toHaveText(cast.artists.headliner.name);
  }

  test('opened with a date: the header, About and setlist', async () => {
    await profile.open('abigail-mensah', cast.search.date);

    await expect(profile.breadcrumbBack()).toHaveText('Discover · Sat 14 Nov');
    await expect(profile.name()).toHaveText('Abigail Mensah');
    await expect(profile.kicker()).toHaveText('Gospel & contemporary vocalist');
    await expect(profile.rating()).toHaveAccessibleName('Rated 4.9 out of 5 by 38 churches');
    await expect(profile.facts()).toContainText('Brampton, ON');
    await expect(profile.facts()).toContainText('Drives up to 120 km');
    await expect(profile.bookButton()).toHaveText('Book for Sat 14 Nov');
    await expect(profile.aboutHeading()).toHaveText('Raised in the choir loft');
    await expect(profile.aboutParagraphs()).toHaveCount(2);
    await expect(profile.aboutParagraphs().first()).toContainText('nine years');
    await expect(profile.setlistHeading()).toHaveText('Songs Abigail leads');
    await expect(profile.setlistNote()).toHaveText('Ask for any of these, or send your own list.');
    await expect(profile.songs()).toHaveCount(8);
    await expect(profile.songs().first()).toHaveText(/Way Maker\s*Sinach\s*Key of E/);
    await expect(profile.songs().nth(3)).toContainText('Key of B♭');
  });

  test('opened without a date: plain back link, Check dates, and New for no reviews', async () => {
    await profile.open('miriam-haile');

    await expect(profile.breadcrumbBack()).toHaveText('Discover');
    await expect(profile.bookButton()).toHaveText('Check dates');
    await expect(profile.kicker()).toHaveText('New to Zamaro · Solo vocalist & pianist');
    await expect(profile.facts()).toContainText('New · No reviews yet');
  });

  test('an artist without an About heading is introduced by name', async () => {
    await profile.open('marcus-bell-trio');

    await expect(profile.aboutHeading()).toHaveText('About Marcus Bell Trio');
  });

  test('from the lineup: the Headliner kicker, and Back returns to the same results', async () => {
    await searchBurlington();

    await discover.lineup.headliner().name().getByRole('link').click();

    await expect(profile.kicker()).toHaveText('Headliner · Gospel & contemporary vocalist');
    await profile.goBack();
    await expect(discover.lineup.summary()).toHaveText('Sat 14 Nov · 7 free · within 120 km');
    await expect(discover.lineup.headliner().name()).toHaveText(cast.artists.headliner.name);
  });

  test('markup in a bio is shown as text and never runs', async () => {
    await searchBurlington();
    await profile.alterProfile('marcus-bell-trio', {
      bio: '<script>window.zmPwned = true</script> We play hymns.',
    });

    await discover.lineup.ticket('Marcus Bell Trio').link().click();

    await expect(profile.aboutParagraphs().first()).toHaveText(
      '<script>window.zmPwned = true</script> We play hymns.',
    );
    expect(await profile.scriptRan()).toBe(false);
  });

  test('a slow profile shows a busy region, then the profile', async () => {
    await searchBurlington();
    await profile.delayProfile('abigail-mensah', 1500);

    await discover.lineup.headliner().name().getByRole('link').click();

    await expect(profile.loadingStatus()).toBeAttached();
    await expect(profile.busyRegion()).toHaveCount(1);
    await expect(profile.name()).toHaveText('Abigail Mensah');
    await expect(profile.busyRegion()).toHaveCount(0);
  });

  test('a server error shows Try again and Back to the lineup', async () => {
    await searchBurlington();
    await profile.failProfile('abigail-mensah');

    await discover.lineup.headliner().name().getByRole('link').click();

    await expect(profile.errorAlert()).toContainText('We couldn’t reach the artist’s page');
    await expect(profile.errorAlert()).toContainText(
      'It’s on our side, not yours. Your search is saved and any request you’ve sent is safe.',
    );
    await expect(profile.backToLineup()).toHaveAttribute('href', /^\/\?date=2026-11-14/);

    await profile.restoreProfile('abigail-mensah');
    await profile.tryAgain();
    await expect(profile.name()).toHaveText('Abigail Mensah');
  });
});
