import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { DiscoverPage } from '../../pages/discover.page';

// L2-007 (sort), L2-008 (filters), L2-009.1/.3/.4 (search state in the URL), L2-102.2.
test.describe('Sorting, filtering and sharing the lineup', () => {
  let discover: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    discover = new DiscoverPage(page);
    await discover.freezeClock();
  });

  async function searchBurlington(): Promise<void> {
    await discover.openAndHydrate();
    await discover.form.fill({ date: cast.search.date, kind: cast.search.kind });
    await discover.form.pickCity(cast.search.city);
    await discover.form.showTheLineup();
    await expect(discover.lineup.headliner().name()).toHaveText(cast.artists.headliner.name);
  }

  test('price, low to high keeps the headliner and numbers the tickets from No. 02', async () => {
    await searchBurlington();

    await discover.lineup.sortBy('Price, low to high');

    await expect(discover.lineup.ticketNames()).toHaveText([
      'Elijah Park',
      'Daniel & Ruth Okonkwo',
      'Luz Viva',
      'Marcus Bell Trio',
      'Hosanna Collective',
      'Grace Tabernacle Mass Choir',
    ]);
    await expect(discover.lineup.headliner().name()).toHaveText(cast.artists.headliner.name);
    await expect(discover.lineup.ticket('Elijah Park').position()).toContainText('No. 02');
    await expect(discover.form.dateField()).toHaveValue(cast.search.date);
    expect(discover.urlParams().get('sort')).toBe('price');
  });

  test('style chips match any selected style, and the summary counts and announces only them', async () => {
    await searchBurlington();

    await discover.lineup.toggleStyle('Band');
    await expect(discover.lineup.summary()).toHaveText('Sat 14 Nov · 3 free · within 120 km');
    await discover.lineup.toggleStyle('Gospel choir');

    await expect(discover.lineup.summary()).toHaveText('Sat 14 Nov · 4 free · within 120 km');
    await expect(discover.lineup.styleChip('Band')).toHaveAttribute('aria-pressed', 'true');
    await expect(discover.lineup.styleChip('Gospel choir')).toHaveAttribute('aria-pressed', 'true');
    await expect(discover.lineup.headliner().name()).toHaveText('Marcus Bell Trio');
    await expect(discover.lineup.ticketNames()).toHaveText([
      'Hosanna Collective',
      'Luz Viva',
      'Grace Tabernacle Mass Choir',
    ]);
    await expect(discover.lineup.announcement()).toHaveText('Sat 14 Nov · 4 free · within 120 km');
  });

  test('a shared link restores the inputs, sort, filters and results', async () => {
    await discover.openLink({
      date: '2026-11-14',
      kind: 'worship-night',
      lat: '43.325',
      lng: '-79.799',
      place: 'Burlington',
      radius: '120',
      sort: 'price',
      styles: 'hymns',
      price: 'under-800',
    });

    await expect(discover.form.dateField()).toHaveValue('2026-11-14');
    await expect(discover.form.locationField()).toHaveValue('Burlington');
    expect(await discover.form.selectedText(discover.form.kindField())).toBe('Worship night');
    expect(await discover.form.selectedText(discover.lineup.sortField())).toBe('Price, low to high');
    await expect(discover.lineup.styleChip('Hymns')).toHaveAttribute('aria-pressed', 'true');
    await expect(discover.lineup.styleChip('Under $800')).toHaveAttribute('aria-pressed', 'true');
    await expect(discover.lineup.headliner().name()).toHaveText(cast.artists.headliner.name);
    await expect(discover.lineup.ticketNames()).toHaveText(['Daniel & Ruth Okonkwo']);
  });

  test('an invalid parameter falls back to its default and the rest still apply', async () => {
    await discover.openLink({
      date: '2026-11-14',
      kind: 'worship-night',
      lat: '43.325',
      lng: '-79.799',
      place: 'Burlington',
      radius: '999',
    });

    expect(await discover.form.selectedText(discover.form.radiusField())).toBe('120 km · 1.5 hr');
    await expect(discover.lineup.summary()).toHaveText('Sat 14 Nov · 7 free · within 120 km');
  });

  test('the address bar carries rounded coordinates and a town, never a street address', async () => {
    await searchBurlington();

    const params = discover.urlParams();
    expect(params.get('lat')).toBe('43.325');
    expect(params.get('lng')).toBe('-79.799');
    expect(params.get('place')).toBe('Burlington');
    expect([...params.keys()].sort()).toEqual(['date', 'kind', 'lat', 'lng', 'place', 'radius']);
  });
});
