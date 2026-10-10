import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { freezeClock } from '../../fixtures/clock';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';
import { NotFoundPage } from '../../pages/not-found.page';

// L2-021 with real HTTP statuses from the server render (L2-112): a missing or hidden artist, a renamed
// address (L2-055.3), and an address that is no page at all. Selah Brooks is a suspended solo vocalist;
// `abigail-sings` is Abigail's retired address.
test.describe('An artist who isn’t on Zamaro', () => {
  let notFound: NotFoundPage;
  let profile: ArtistProfilePage;
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    notFound = new NotFoundPage(page);
    profile = new ArtistProfilePage(page);
    discover = new DiscoverPage(page);
    await freezeClock(page);
  });

  test('a suspended artist’s address answers 404 with similar artists and nothing of the profile', async () => {
    const status = await notFound.open(`/artists/selah-brooks?date=${cast.search.date}`);

    expect(status).toBe(404);
    await expect(notFound.overline()).toHaveText('Error 404 · Artist not found');
    await expect(notFound.decorativePoster()).toHaveText('No show');
    await expect(notFound.heading()).toHaveText('This artist isn’t on Zamaro');
    expect((await notFound.shell.landmarkCounts()).h1).toBe(1);
    await expect(notFound.lead()).toHaveText(
      'They may have left or changed their address. Here are similar artists who are free on Sat 14 Nov, nearest first.',
    );
    // Opened without a search, the solo vocalists free that day are measured from Toronto.
    await expect(notFound.similarKicker()).toHaveText('Sat 14 Nov · within 120 km of Toronto');
    await expect(notFound.similarList()).toHaveAccessibleName(
      'Similar artists free Saturday 14 November 2026',
    );
    await expect(notFound.similarNames()).toHaveText([
      'Miriam Haile',
      'Elijah Park',
      'Abigail Mensah',
    ]);
    await expect(notFound.suggestion('Miriam Haile').position()).toContainText('No. 01');
    await expect(notFound.suggestion('Elijah Park').meta()).toContainText('from Toronto');
    await expect(notFound.shell.main()).not.toContainText('Selah');
  });

  test('an address that never existed gets the same page', async () => {
    const status = await notFound.open(`/artists/nobody-at-all?date=${cast.search.date}`);

    expect(status).toBe(404);
    await expect(notFound.heading()).toHaveText('This artist isn’t on Zamaro');
    await expect(notFound.lead()).toContainText('free on Sat 14 Nov, nearest first.');
    await expect(notFound.similarNames()).toHaveCount(3);
  });

  test('the browser keeps the server’s page without asking for the profile again', async () => {
    await notFound.open(`/artists/selah-brooks?date=${cast.search.date}`);

    await expect(notFound.heading()).toHaveText('This artist isn’t on Zamaro');
    expect(notFound.profileRequestsFromBrowser()).toBe(0);
  });

  test('from a Discover search, the suggestions are measured from the church', async () => {
    await discover.openLink({
      date: cast.search.date,
      kind: 'worship-night',
      lat: '43.325',
      lng: '-79.799',
      place: 'Burlington',
      radius: '120',
    });
    await notFound.hideAfterListing('elijah-park', 'selah-brooks');

    await discover.lineup.ticket('Elijah Park').link().click();

    await expect(notFound.heading()).toHaveText('This artist isn’t on Zamaro');
    await expect(notFound.similarKicker()).toHaveText('Sat 14 Nov · within 120 km of Burlington');
    await expect(notFound.similarNames()).toHaveText(['Abigail Mensah', 'Elijah Park']);
    await expect(notFound.suggestion('Abigail Mensah').meta()).toContainText(
      'Brampton · 44 km from you',
    );
    await expect(notFound.suggestion('Elijah Park').meta()).toContainText(
      'Markham · 74 km from you',
    );
    await expect(notFound.suggestion('Abigail Mensah').price()).toContainText('$650');
    await expect(notFound.fullLineupLink()).toHaveAttribute(
      'href',
      /^\/\?date=2026-11-14&kind=worship-night&.*place=Burlington/,
    );
  });

  test('a suggestion opens that artist’s profile on the same date', async () => {
    await notFound.open(`/artists/selah-brooks?date=${cast.search.date}`);

    await notFound.suggestion('Elijah Park').link().click();

    await expect(profile.name()).toHaveText('Elijah Park');
    expect(notFound.address()).toBe(`/artists/elijah-park?date=${cast.search.date}`);
  });

  test('a renamed artist’s old address answers 301 to the new one and keeps the query', async () => {
    const answer = await notFound.ask(`/artists/abigail-sings?date=${cast.search.date}`);

    expect(answer).toEqual({
      status: 301,
      location: `/artists/abigail-mensah?date=${cast.search.date}`,
    });

    expect(await notFound.open(`/artists/abigail-sings?date=${cast.search.date}`)).toBe(200);
    await expect(profile.name()).toHaveText('Abigail Mensah');
    expect(notFound.address()).toBe(`/artists/abigail-mensah?date=${cast.search.date}`);
  });
});

test.describe('An address that is no page', () => {
  let notFound: NotFoundPage;
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    notFound = new NotFoundPage(page);
    discover = new DiscoverPage(page);
    await freezeClock(page);
  });

  test('answers 404 with the generic page and a way back to Discover', async () => {
    const status = await notFound.open('/no-such-page');

    expect(status).toBe(404);
    await expect(notFound.overline()).toHaveText('Error 404 · Page not found');
    await expect(notFound.heading()).toHaveAccessibleName('No show: page not found');
    await expect(notFound.lead()).toHaveText(
      'We couldn’t find that page. The link may be old, or the address has a typo.',
    );
    await expect(notFound.actions()).toHaveText(['Find who’s free']);
    await expect(notFound.note()).toHaveText(
      'Followed a link from one of our emails? Tell us and we’ll fix it.',
    );

    await notFound.findWhosFree();

    await expect(discover.posterHeadline()).toContainText('Who’s free');
    expect(notFound.address()).toBe('/');
  });
});
