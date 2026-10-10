import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { DiscoverPage } from '../../pages/discover.page';

// L2-004.2, .5, .6, .7; L2-006.1, .3; L2-102.3, .4; L2-110.1, .3, .5; L2-002.4.
test.describe('Searching for who is free', () => {
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    discover = new DiscoverPage(page);
    await discover.freezeClock();
    await discover.openAndHydrate();
  });

  test('a guest starts with an empty form and a 120 km radius', async () => {
    await expect(discover.form.dateField()).toHaveValue('');
    await expect(discover.form.locationField()).toHaveValue('');
    expect(await discover.form.selectedText(discover.form.radiusField())).toBe('120 km · 1.5 hr');
    await expect(discover.posterHeadline()).toHaveText('Who’s free Pick a date');
  });

  test('a city chip and "Show the lineup" load the lineup without reloading the page', async () => {
    await discover.markDocument();
    await discover.form.fill({ date: cast.search.date, kind: cast.search.kind });
    await discover.form.pickCity(cast.search.city);
    await expect(discover.form.locationField()).toHaveValue('Burlington, ON');
    await expect(discover.form.cityChip(cast.search.city)).toHaveAttribute('aria-pressed', 'true');

    await discover.form.showTheLineup();

    await expect(discover.posterHeadline()).toHaveText('Who’s free Sat 14 Nov');
    await expect(discover.lineup.summary()).toHaveText('Sat 14 Nov · 7 free · within 120 km');
    await expect(discover.lineup.ticketNames()).toHaveText([
      'Marcus Bell Trio',
      'Hosanna Collective',
      'Abigail Mensah',
      'Luz Viva',
      'Elijah Park',
      'Grace Tabernacle Mass Choir',
      'Daniel & Ruth Okonkwo',
    ]);
    const marcus = discover.lineup.ticket(cast.artists.closest.name);
    await expect(marcus.position()).toContainText('No. 01');
    await expect(marcus.meta()).toHaveText(/Band · Acoustic, Hymns\s*Hamilton · 14 km from you/);
    await expect(marcus.price()).toHaveText('From$950');
    await expect(marcus.rating()).toHaveAccessibleName('Rated 4.6 out of 5 by 17 churches');
    await expect(discover.lineup.ticket('Hosanna Collective').price()).toHaveText('From$1,800');
    await expect(discover.lineup.ticket('Abigail Mensah').meta()).toContainText('Solo vocalist · Hymns');
    await expect(discover.lineup.ticket('Daniel & Ruth Okonkwo').meta()).toContainText(
      'Duo · Acoustic, Hymns',
    );
    await expect(marcus.link()).toHaveAttribute('href', '/artists/marcus-bell-trio?date=2026-11-14');
    expect(await discover.documentWasReloaded()).toBe(false);
  });

  test('submitting without a date or location shows inline errors and focuses the date', async () => {
    await discover.form.showTheLineup();

    await expect(discover.form.errorSummary()).toContainText('Two things before we can search');
    await expect(await discover.form.errorFor(discover.form.dateField())).toHaveText(
      'Pick your event date.',
    );
    await expect(await discover.form.errorFor(discover.form.locationField())).toHaveText(
      'Enter your church’s address or town, or pick a city below.',
    );
    await expect(discover.form.dateField()).toHaveAttribute('aria-invalid', 'true');
    await expect(discover.form.dateField()).toBeFocused();
    expect(discover.searchesSent()).toBe(0);
  });

  test('a date less than three days away is refused before searching', async () => {
    await discover.form.fill({ date: '2026-10-11' });
    await discover.form.pickCity('Burlington');

    await discover.form.showTheLineup();

    await expect(await discover.form.errorFor(discover.form.dateField())).toHaveText(
      'Pick a date at least 3 days away.',
    );
    expect(discover.searchesSent()).toBe(0);
  });

  test('a typed town is looked up and searched from its centre', async () => {
    await discover.form.fill({ date: cast.search.date, kind: cast.search.kind });
    await discover.form.typeLocation('Hamilton');

    await discover.form.showTheLineup();

    await expect(discover.lineup.ticket(cast.artists.closest.name).meta()).toContainText(
      'Hamilton · Under 1 km from you',
    );
  });
});
