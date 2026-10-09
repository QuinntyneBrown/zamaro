import { expect, test } from '@playwright/test';
import { DiscoverPage } from '../../pages/discover.page';

// L2-096.1 (320 px), L2-101.1 (skip link), L2-102.1 (landmarks, one h1), L2-111.2 (catalogue text).
test.describe('The page shell', () => {
  test('is server-rendered with the header links, one main region, a footer and one h1', async ({
    browser,
  }) => {
    const withoutScripts = await browser.newContext({ javaScriptEnabled: false });
    const discover = new DiscoverPage(await withoutScripts.newPage());

    await discover.open();

    await expect(discover.shell.primaryNavLinks()).toHaveText([
      'Discover',
      'How booking works',
      'For artists',
    ]);
    expect(await discover.shell.landmarkCounts()).toEqual({
      banner: 1,
      main: 1,
      contentinfo: 1,
      h1: 1,
    });
    await withoutScripts.close();
  });

  test('reuses the catalogue the server fetched instead of fetching it again', async ({ page }) => {
    const discover = new DiscoverPage(page);

    await discover.openAndHydrate();

    await expect(discover.shell.primaryNavLinks().first()).toHaveText('Discover');
    expect(discover.catalogueRequestsFromBrowser()).toBe(0);
  });

  test('puts "Skip to content" first in the tab order and moves focus to the main region', async ({
    page,
  }) => {
    const discover = new DiscoverPage(page);
    await discover.openAndHydrate();

    await discover.shell.pressTab();
    await expect(discover.shell.skipLink()).toBeFocused();
    await expect(discover.shell.skipLink()).toBeInViewport();

    await discover.shell.useSkipLink();
    await expect(discover.shell.main()).toBeFocused();
  });

  test('does not scroll sideways at 320 px', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await discover.useWidth(320);

    await discover.openAndHydrate();

    expect(await discover.shell.hasHorizontalScroll()).toBe(false);
  });
});
