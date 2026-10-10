import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { Ticket } from '../../pages/lineup';
import { DiscoverPage } from '../../pages/discover.page';

// L2-010: 24 cards at a time. The supporting cast has 30 artists within 40 km of Barrie.
test.describe('Paging the lineup', () => {
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    discover = new DiscoverPage(page);
    await discover.freezeClock();
  });

  test('shows 24 cards, then "Show more artists" adds the rest and moves focus to the first', async () => {
    await discover.openLink({
      date: cast.search.date,
      kind: 'worship-night',
      lat: '44.389',
      lng: '-79.69',
      place: 'Barrie',
      radius: '40',
    });

    await expect(discover.lineup.headliner().root()).toBeVisible();
    await expect(discover.lineup.tickets()).toHaveCount(23);
    await expect(discover.lineup.showMoreButton()).toBeVisible();

    await discover.lineup.showMore();

    await expect(discover.lineup.tickets()).toHaveCount(29);
    await expect(Ticket.at(discover.lineup, 23).link()).toBeFocused();
    await expect(Ticket.at(discover.lineup, 23).position()).toContainText('No. 25');
    await expect(discover.lineup.showMoreButton()).toHaveCount(0);
  });

  test('24 or fewer results have no "Show more artists"', async () => {
    await discover.openLink({
      date: cast.search.date,
      kind: 'worship-night',
      lat: '43.325',
      lng: '-79.799',
      place: 'Burlington',
      radius: '120',
    });

    await expect(discover.lineup.tickets()).toHaveCount(6);
    await expect(discover.lineup.showMoreButton()).toHaveCount(0);
  });
});
