import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { DiscoverPage } from '../../pages/discover.page';

// L2-105.1 (loading), L2-106.1-3 (search error), L2-077.2 (searches over the limit).
test.describe('While and when a search does not return the lineup', () => {
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    discover = new DiscoverPage(page);
    await discover.freezeClock();
    await discover.openAndHydrate();
    await discover.form.fill({ date: cast.search.date, kind: cast.search.kind });
    await discover.form.pickCity(cast.search.city);
  });

  test('a slow search shows skeletons in a busy region, then the lineup', async () => {
    await discover.delaySearches(1500);

    await discover.form.showTheLineup();

    await expect(discover.lineup.region()).toHaveAttribute('aria-busy', 'true');
    await expect(discover.lineup.status()).toHaveText(
      'Finding who’s free on Saturday 14 November 2026…',
    );
    await expect(discover.lineup.skeletons().first()).toBeVisible();

    await expect(discover.lineup.headliner().name()).toHaveText('Abigail Mensah');
    await expect(discover.lineup.region()).not.toHaveAttribute('aria-busy', 'true');
    await expect(discover.lineup.skeletons()).toHaveCount(0);
  });

  test('a failed search keeps every input and offers Try again, which repeats it', async () => {
    await discover.failSearches();

    await discover.form.showTheLineup();

    await expect(discover.lineup.alert()).toContainText('We lost the signal');
    await expect(discover.lineup.alert()).toContainText(
      'We couldn’t load who’s free on Saturday 14 November 2026. Your date, location and filters are kept.',
    );
    await expect(discover.lineup.emailLink()).toHaveAttribute('href', 'mailto:hello@zamaro.ca');
    await expect(discover.lineup.statusLink()).toHaveCount(0);
    await expect(discover.form.dateField()).toHaveValue(cast.search.date);
    await expect(discover.form.locationField()).toHaveValue('Burlington, ON');

    await discover.restoreSearches();
    await discover.lineup.tryAgain();

    await expect(discover.lineup.headliner().name()).toHaveText('Abigail Mensah');
    await expect(discover.lineup.alert()).toHaveCount(0);
  });

  test('the third failure in a row also links to the status page', async () => {
    await discover.failSearches();

    await discover.form.showTheLineup();
    await discover.lineup.tryAgain();
    await expect(discover.lineup.statusLink()).toHaveCount(0);
    await discover.lineup.tryAgain();

    await expect(discover.lineup.statusLink()).toHaveAttribute('href', 'https://status.zamaro.ca');
  });

  test('a search over the limit says how long to wait and counts down', async () => {
    await discover.limitSearches(2);

    await discover.form.showTheLineup();

    await expect(discover.lineup.alert()).toContainText('Too many searches in a minute');
    await expect(discover.lineup.alert()).toContainText(
      'Give it 2 seconds, then try again. Your date, location and filters are kept.',
    );
    await expect(discover.lineup.tryAgainButton()).toHaveText('Try again in 2 s');
    await expect(discover.lineup.tryAgainButton()).toBeDisabled();

    await expect(discover.lineup.tryAgainButton()).toHaveText('Try again', { timeout: 5000 });
    await expect(discover.lineup.tryAgainButton()).toBeEnabled();
  });
});
