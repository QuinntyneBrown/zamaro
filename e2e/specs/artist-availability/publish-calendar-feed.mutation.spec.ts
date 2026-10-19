import { expect, test } from '@playwright/test';
import { signInAs } from '../../fixtures/accounts';
import { AvailabilityPage } from '../../pages/availability.page';
import { CalendarFeedDialog } from '../../pages/calendar-feed.dialog';

const LINK = /^http:\/\/.+\/api\/v1\/calendar-feeds\/[A-Za-z0-9_-]{43}\.ics$/;

/** The link names the API's own origin; the suite reaches the API through the site's /api proxy. */
function feedPath(url: string): string {
  return new URL(url).pathname;
}

// L2-058 (publish-calendar-feed): Abigail turns on her secret calendar link, subscribes a calendar
// to it, and makes a new one, which retires the old one at once. This changes the seed, so it runs
// in the zamaro-mutations project.
test.describe('Publishing a calendar feed', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await signInAs(page.context(), 'abigail');
  });

  test('turning the feed on gives a secret link that lists her Confirmed bookings (L2-058.1)', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new CalendarFeedDialog(page);
    await dialog.allowClipboard();
    await availability.open('2026-11');

    await availability.subscribeButton().click();
    await expect(dialog.heading()).toHaveText('Subscribe in your calendar');
    await expect(dialog.actionButton()).toHaveText('Turn on calendar feed');
    const status = await dialog.act();

    expect(status).toBe(201);
    await expect(dialog.link()).toHaveValue(LINK);
    const link = await dialog.link().inputValue();
    await dialog.copyButton().click();
    await expect(dialog.copyButton()).toHaveText('Copied');
    expect(await dialog.clipboardText()).toBe(link);
    await expect(dialog.dialog()).toContainText(
      'Anyone with this link can see your Confirmed bookings, so keep it to yourself.',
    );

    const feed = await page.request.get(feedPath(link));
    expect(feed.status()).toBe(200);
    expect(feed.headers()['content-type']).toBe('text/calendar; charset=utf-8');
    const ics = await feed.text();
    expect(ics).toContain('UID:ZAM-0108@zamaro.ca');
    expect(ics).toContain('SUMMARY:Sunday service · Lakeshore Alliance Church');
    expect(ics).not.toContain('ZAM-0114@');

    await dialog.wayBackButton().click();
    await expect(dialog.dialog()).toHaveCount(0);
    await expect(availability.subscribeButton()).toBeFocused();
  });

  test('once on, the dialog opens straight to the link', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new CalendarFeedDialog(page);
    await availability.open('2026-11');

    await availability.subscribeButton().click();

    await expect(dialog.link()).toHaveValue(LINK);
    await expect(dialog.actionButton()).toHaveCount(0);
    await expect(dialog.wayBackButton()).toHaveText('Done');
  });

  test('making a new link retires the old one at once (L2-058.2)', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new CalendarFeedDialog(page);
    await availability.open('2026-11');
    await availability.subscribeButton().click();
    const old = await dialog.link().inputValue();

    await dialog.makeNewLinkButton().click();
    await expect(dialog.heading()).toHaveText('Make a new link?');
    await expect(dialog.wayBackButton()).toHaveText('Keep current link');
    await expect(dialog.wayBackButton()).toBeFocused();
    const status = await dialog.act();

    expect(status).toBe(200);
    await expect(dialog.heading()).toHaveText('Subscribe in your calendar');
    const fresh = await dialog.link().inputValue();
    expect(fresh).toMatch(LINK);
    expect(fresh).not.toBe(old);
    expect((await page.request.get(feedPath(old))).status()).toBe(404);
    expect((await page.request.get(feedPath(fresh))).status()).toBe(200);
  });

  test('a new link that fails keeps the current one working and offers Try again', async ({
    page,
  }) => {
    const availability = new AvailabilityPage(page);
    const dialog = new CalendarFeedDialog(page);
    await availability.open('2026-11');
    await availability.subscribeButton().click();
    const current = await dialog.link().inputValue();
    await page.route('**/api/v1/artist/calendar-feed/regeneration', (route) => route.abort());

    await dialog.makeNewLinkButton().click();
    await dialog.actionButton().click();

    await expect(dialog.failedAlert()).toContainText('We couldn’t make a new link');
    await expect(dialog.failedAlert()).toContainText(
      'Your current link still works. Check your connection and try again.',
    );
    await expect(dialog.link()).toHaveValue(current);
    await expect(dialog.actionButton()).toHaveText('Try again');
    expect((await page.request.get(feedPath(current))).status()).toBe(200);
  });
});
