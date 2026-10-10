import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { freezeClock, passTime, startClock } from '../../fixtures/clock';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { Crawler } from '../../pages/crawler';

const abigail = cast.artists.headliner;
const ABIGAIL_TITLE = 'Abigail Mensah · Worship artist in Brampton · Zamaro';
const ABIGAIL_DESCRIPTION =
  'Gospel & contemporary vocalist. I grew up in my mother’s church in Brampton, learning harmonies from aunties who never needed a microphone. I’ve led worship…';

// L2-112: crawlers get complete server-rendered pages with a title, a description, a canonical address
// and structured data; /robots.txt and /sitemap.xml say what to index.
test.describe('Search engines index the public pages', () => {
  let crawler: Crawler;

  test.beforeEach(async ({ page }) => {
    crawler = new Crawler(page);
  });

  test('Abigail’s profile names her, her city and her headline before any script runs', async ({
    baseURL,
  }) => {
    const head = await crawler.read(`/artists/${abigail.slug}?date=${cast.search.date}`);

    expect(head.title).toBe(ABIGAIL_TITLE);
    expect(head.description).toBe(ABIGAIL_DESCRIPTION);
    // The canonical address drops the carried search.
    expect(head.canonical).toBe(`${baseURL}/artists/${abigail.slug}`);
    expect(head.robots).toBeNull();
    expect(head.mainText).toContain('Raised in the choir loft');
    expect(head.mainText).toContain('Great Is Thy Faithfulness');
    expect(head.mainText).toContain('What churches say');
  });

  test('a link to Abigail’s profile previews her name, headline and primary photo', async ({
    baseURL,
  }) => {
    const head = await crawler.read(`/artists/${abigail.slug}`);
    const photo = `${baseURL}/media/artists/${abigail.slug}/photos/1-1200.webp`;

    expect(head.openGraph).toEqual({
      site_name: 'Zamaro',
      type: 'profile',
      title: ABIGAIL_TITLE,
      description: ABIGAIL_DESCRIPTION,
      url: `${baseURL}/artists/${abigail.slug}`,
      image: photo,
      'image:alt': 'Abigail at the microphone during a Sunday service',
    });
    expect(head.twitter).toEqual({
      card: 'summary_large_image',
      title: ABIGAIL_TITLE,
      description: ABIGAIL_DESCRIPTION,
      image: photo,
      'image:alt': 'Abigail at the microphone during a Sunday service',
    });
  });

  test('a solo vocalist with reviews is a Person with an aggregate rating', async ({ baseURL }) => {
    const head = await crawler.read(`/artists/${abigail.slug}`);

    expect(head.structuredData).toEqual([
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Abigail Mensah',
        url: `${baseURL}/artists/${abigail.slug}`,
        image: `${baseURL}/media/artists/${abigail.slug}/photos/1-1200.webp`,
        description: ABIGAIL_DESCRIPTION,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Brampton',
          addressRegion: 'ON',
          addressCountry: 'CA',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: 4.9,
          reviewCount: 38,
          bestRating: 5,
          worstRating: 1,
        },
      },
    ]);
  });

  test('a band is a MusicGroup, and with no photos its preview has no image', async () => {
    const head = await crawler.read('/artists/marcus-bell-trio');

    expect(head.title).toBe('Marcus Bell Trio · Worship artist in Hamilton · Zamaro');
    expect(head.structuredData[0]['@type']).toBe('MusicGroup');
    expect(head.structuredData[0]['image']).toBeUndefined();
    expect(head.openGraph['image']).toBeUndefined();
    expect(head.twitter['card']).toBe('summary');
  });

  test('an artist with no reviews has no aggregate rating', async () => {
    const head = await crawler.read('/artists/miriam-haile');

    expect(head.title).toBe('Miriam Haile · Worship artist in Etobicoke · Zamaro');
    expect(head.structuredData[0]['@type']).toBe('Person');
    expect(head.structuredData[0]).not.toHaveProperty('aggregateRating');
  });

  test('Discover has its own title and description, and How booking works is in the HTML', async ({
    baseURL,
  }) => {
    const head = await crawler.read('/');

    expect(head.title).toBe('Worship artists within driving distance of Toronto · Zamaro');
    expect(head.description).toBe(
      'Tell us the date and where your church is. We’ll show who’s free and will drive to you.',
    );
    expect(head.canonical).toBe(`${baseURL}/`);
    expect(head.openGraph['type']).toBe('website');
    expect(head.structuredData).toEqual([]);
    expect(head.mainText).toContain('How booking works');
    expect(head.mainText).toContain('Lock it in');
  });

  test('a page that is not there and a missing artist are titled as such and kept out of the index', async () => {
    const page = await crawler.read('/no-such-page');
    expect(page.title).toBe('Page not found · Zamaro');
    expect(page.robots).toBe('noindex');
    expect(page.canonical).toBeNull();

    const artist = await crawler.read('/artists/selah-brooks');
    expect(artist.title).toBe('Artist not found · Zamaro');
    expect(artist.robots).toBe('noindex');
    expect(artist.structuredData).toEqual([]);
  });

  test('robots.txt keeps crawlers out of private areas but not out of profiles', async ({
    baseURL,
  }) => {
    const rules = await crawler.robots();

    expect(rules).toEqual(
      expect.arrayContaining([
        'User-agent: *',
        'Allow: /artists/',
        'Disallow: /admin',
        'Disallow: /artist',
        'Disallow: /bookings',
        'Disallow: /saved',
        'Disallow: /api',
        `Sitemap: ${baseURL}/sitemap.xml`,
      ]),
    );
  });

  test('the sitemap lists Discover and every published profile, but not a suspended artist', async ({
    baseURL,
  }) => {
    const sitemap = await crawler.sitemap();
    const locations = sitemap.entries.map((entry) => entry.loc);

    expect(sitemap.contentType).toContain('application/xml');
    expect(locations).toContain(`${baseURL}/`);
    expect(locations).toContain(`${baseURL}/artists/${abigail.slug}`);
    expect(locations).toContain(`${baseURL}/artists/marcus-bell-trio`);
    expect(locations).not.toContain(`${baseURL}/artists/selah-brooks`);
    const profile = sitemap.entries.find((entry) => entry.loc.endsWith(`/${abigail.slug}`));
    expect(profile?.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

test.describe('The head follows the page in the browser', () => {
  test('going back from a profile to Discover swaps the title and drops the profile’s data', async ({
    page,
    baseURL,
  }) => {
    const profile = new ArtistProfilePage(page);
    await freezeClock(page);
    await profile.open(abigail.slug, cast.search.date);
    expect((await profile.shell.head()).structuredData).toHaveLength(1);

    await profile.breadcrumbBack().click();

    await expect(page).toHaveTitle('Worship artists within driving distance of Toronto · Zamaro');
    const head = await profile.shell.head();
    expect(head.canonical).toBe(`${baseURL}/`);
    expect(head.structuredData).toEqual([]);
    expect(head.openGraph['image']).toBeUndefined();
  });
});

// L2-113.2–3: Share opens the device's share sheet, or copies the link and confirms with a toast
// (docs/mocks/notifications/share-toast/success).
test.describe('Sharing a profile', () => {
  let profile: ArtistProfilePage;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
  });

  test('a device with a share sheet shares the canonical address and the title, and no toast follows', async ({
    page,
    baseURL,
  }) => {
    await profile.withShareSheet();
    await freezeClock(page);
    await profile.open(abigail.slug, cast.search.date);

    await profile.share();

    await expect
      .poll(() => profile.shareRequests())
      .toEqual([{ title: ABIGAIL_TITLE, url: `${baseURL}/artists/${abigail.slug}` }]);
    await expect(profile.shell.toasts()).toHaveCount(0);
  });

  test('closing the share sheet does nothing more', async ({ page }) => {
    await profile.withShareSheet('dismissed');
    await freezeClock(page);
    await profile.open(abigail.slug);

    await profile.share();

    await expect.poll(async () => (await profile.shareRequests()).length).toBe(1);
    await expect(profile.shell.toasts()).toHaveCount(0);
  });

  test('without a share sheet the link is copied and "Link copied" is announced politely', async ({
    page,
    baseURL,
  }) => {
    await profile.withoutShareSheet();
    await freezeClock(page);
    await profile.open(abigail.slug, cast.search.date);
    await expect(profile.shell.toastRegion()).toHaveAttribute('role', 'status');
    await expect(profile.shell.toastRegion()).toHaveAttribute('aria-live', 'polite');
    await expect(profile.shell.toasts()).toHaveCount(0);

    await profile.share();

    const toast = profile.shell.toast('Link copied');
    await expect(toast.root).toBeVisible();
    await expect(toast.kind()).toHaveText('Shared');
    await expect(toast.text()).toHaveCount(0);
    await expect(toast.dismissButton()).toHaveAccessibleName('Dismiss: Link copied');
    expect(await profile.clipboardText()).toBe(`${baseURL}/artists/${abigail.slug}`);
    // Showing a toast never moves focus.
    expect(await profile.focusedElementIs(profile.shareButton())).toBe(true);
  });

  test('sharing twice shows one toast', async ({ page }) => {
    await profile.withoutShareSheet();
    await freezeClock(page);
    await profile.open(abigail.slug);

    await profile.share();
    await profile.share();

    await expect(profile.shell.toast('Link copied').root).toBeVisible();
    await expect(profile.shell.toasts()).toHaveCount(1);
  });

  test('the toast leaves after 5 seconds, and waits while the pointer is on it', async ({
    page,
  }) => {
    await profile.withoutShareSheet();
    await startClock(page);
    await profile.open(abigail.slug);

    await profile.share();
    const toast = profile.shell.toast('Link copied');
    await expect(toast.root).toBeVisible();
    await toast.hover();
    await passTime(page, 10_000);
    await expect(toast.root).toBeVisible();

    await profile.name().hover();
    await passTime(page, 5_000);
    await expect(profile.shell.toasts()).toHaveCount(0);
  });

  test('Escape in the toast dismisses it and returns focus to Share', async ({ page }) => {
    await profile.withoutShareSheet();
    await freezeClock(page);
    await profile.open(abigail.slug);
    await profile.share();
    const toast = profile.shell.toast('Link copied');
    await toast.dismissButton().focus();

    await profile.shell.pressEscape();

    await expect(profile.shell.toasts()).toHaveCount(0);
    expect(await profile.focusedElementIs(profile.shareButton())).toBe(true);
  });

  test('the dismiss button closes the toast', async ({ page }) => {
    await profile.withoutShareSheet();
    await freezeClock(page);
    await profile.open(abigail.slug);
    await profile.share();

    await profile.shell.toast('Link copied').dismiss();

    await expect(profile.shell.toasts()).toHaveCount(0);
  });
});
