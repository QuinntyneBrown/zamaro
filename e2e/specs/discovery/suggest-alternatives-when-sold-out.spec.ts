import { expect, test } from '@playwright/test';
import { DiscoverPage } from '../../pages/discover.page';

// L2-011: Christmas Eve near Burlington, gospel choirs within 40 km (docs/mocks/pages/discover/empty.html).
const CHRISTMAS_EVE = {
  date: '2026-12-24',
  kind: 'worship-night',
  lat: '43.325',
  lng: '-79.799',
  place: 'Burlington',
  radius: '40',
  styles: 'gospel-choir',
};

test.describe('When nobody is free', () => {
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    discover = new DiscoverPage(page);
    await discover.freezeClock();
    await discover.openLink(CHRISTMAS_EVE);
  });

  test('says why and offers nearby dates, a wider radius and all styles', async () => {
    const soldOut = discover.lineup.soldOut();

    await expect(discover.lineup.summary()).toHaveText('Thu 24 Dec · 0 free · within 40 km');
    await expect(soldOut.title()).toHaveText('Nobody’s free Christmas Eve within 40 km');
    await expect(soldOut.explanation()).toHaveText(
      'Every gospel choir near Burlington is booked for Christmas Eve. Try a nearby date, or widen the radius: 2 choirs are free within 120 km.',
    );
    await expect(soldOut.datesHeading()).toHaveText('Nearby dates with choirs free');
    await expect(soldOut.nearbyDates()).toHaveText([
      'Wed 23 Dec 1 choir free',
      'Sun 27 Dec 3 choirs free',
      'Sun 20 Dec 2 choirs free',
    ]);
    await expect(soldOut.widerRadiusButton()).toHaveText('Search within 120 km · 2 free');
    await expect(soldOut.showAllStylesButton()).toBeVisible();
  });

  test('a nearby date updates the date field and the poster', async () => {
    await discover.lineup.soldOut().pickDate('Wed 23 Dec');

    await expect(discover.posterHeadline()).toHaveText('Who’s free Wed 23 Dec');
    await expect(discover.form.dateField()).toHaveValue('2026-12-23');
    await expect(discover.lineup.headliner().name()).toHaveText('Lakeshore Gospel Voices');
  });

  test('the wider radius searches again within it', async () => {
    await discover.lineup.soldOut().widerRadiusButton().click();

    expect(await discover.form.selectedText(discover.form.radiusField())).toBe('120 km · 1.5 hr');
    await expect(discover.lineup.summary()).toHaveText('Thu 24 Dec · 2 free · within 120 km');
  });

  test('"Show all styles" releases the chips and searches again', async () => {
    await discover.lineup.soldOut().showAllStylesButton().click();

    await expect(discover.lineup.styleChip('Gospel choir')).toHaveAttribute('aria-pressed', 'false');
    await expect(discover.lineup.headliner().name()).toHaveText('Marcus Bell Trio');
  });
});
