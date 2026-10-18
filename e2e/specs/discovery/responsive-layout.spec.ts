import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';

// L2-097 (Discover layout), L2-098.2 (profile at MD), L2-012.1 (the five-song strip).
const WIDTHS = { xs: 320, sm: 576, md: 768, lg: 992, xl: 1200 } as const;

test.describe('Discover adapts to the screen', () => {
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
    await expect(discover.lineup.headliner().name()).toBeVisible();
  }

  // L2-097.1, .4
  test('at XS everything stacks, the stubs sit below the cards and nothing scrolls sideways', async () => {
    await discover.shell.useWidth(WIDTHS.xs);
    await searchBurlington();

    expect(await discover.formBesidePoster()).toBe(false);
    expect(await discover.ticketsPerRow()).toBe(1);
    expect(await discover.stubBesideBody(cast.artists.closest.name)).toBe(false);
    await discover.lineup.toggleStyle('Band');
    await discover.lineup.toggleStyle('Gospel choir');
    expect(await discover.shell.scrollsSideways()).toBe(false);
  });

  // L2-097.2
  for (const width of [WIDTHS.sm, WIDTHS.md]) {
    test(`at ${width}px the form uses two columns and the stubs sit beside the cards`, async () => {
      await discover.shell.useWidth(width);
      await searchBurlington();

      expect(
        await discover.form.shareARow(discover.form.dateField(), discover.form.kindField()),
      ).toBe(true);
      expect(await discover.stubBesideBody(cast.artists.closest.name)).toBe(true);
      expect(await discover.shell.scrollsSideways()).toBe(false);
    });
  }

  // L2-097.3
  for (const width of [WIDTHS.lg, WIDTHS.xl]) {
    test(`at ${width}px the form sits beside the poster and the lineup has two cards a row`, async () => {
      await discover.shell.useWidth(width);
      await searchBurlington();

      expect(await discover.formBesidePoster()).toBe(true);
      expect(await discover.ticketsPerRow()).toBe(2);
    });
  }
});

test.describe('The artist profile adapts to the screen', () => {
  let profile: ArtistProfilePage;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
    await new DiscoverPage(page).freezeClock();
  });

  // L2-012.1
  test('the header carries a strip of five songs', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await expect(profile.strip()).toHaveCount(5);
  });

  // L2-098.2
  test('at MD the setlist has two columns, the photos four and the videos a three-column grid', async () => {
    await profile.useWidth(WIDTHS.md);
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    expect(await profile.setlistColumns()).toBe(2);
    expect(await profile.photoColumns()).toBe(4);
    const [large, ...rest] = await profile.videoCellWidths();
    expect(rest).toHaveLength(3);
    expect(large).toBeGreaterThan(Math.max(...rest) * 2);
  });
});
