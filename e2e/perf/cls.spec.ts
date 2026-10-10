import { expect, test } from '@playwright/test';
import { cast } from '../fixtures/cast';
import { DiscoverPage } from '../pages/discover.page';

// L2-105.2: swapping the skeletons for the lineup shifts the layout by 0.05 or less.
test('the lineup replaces its skeletons without moving the page', async ({ page }) => {
  const discover = new DiscoverPage(page);
  await discover.recordLayoutShifts();
  await discover.freezeClock();
  await discover.delaySearches(1000);
  await discover.openAndHydrate();
  await discover.form.fill({ date: cast.search.date, kind: cast.search.kind });
  await discover.form.pickCity(cast.search.city);

  await discover.form.showTheLineup();
  await expect(discover.lineup.skeletons().first()).toBeVisible();
  const skeletonsShown = await discover.now();
  await expect(discover.lineup.headliner().name()).toHaveText(cast.artists.headliner.name);

  expect(await discover.layoutShiftSince(skeletonsShown)).toBeLessThanOrEqual(0.05);
});
