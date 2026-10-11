import { expect, test } from '@playwright/test';
import { createBooker, signIn, signInAs } from '../../fixtures/accounts';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';
import { Toasts } from '../../pages/toasts';

/** Naomi's search: Burlington, Sat 14 Nov, a worship night, within 120 km. */
const BURLINGTON = {
  date: '2026-11-14',
  kind: 'worship-night',
  lat: '43.325',
  lng: '-79.799',
  place: 'Burlington',
  radius: '120',
};

// L2-006.4, L2-026.1–.2 and L2-109 (accounts/save-artist).
test.describe('Saving an artist', () => {
  test('Naomi’s hearts show who she saved, and the header counts them', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await signInAs(page.context(), 'naomi');

    await discover.openLink(BURLINGTON);

    await expect(discover.lineup.saveToggle('Luz Viva')).toHaveAttribute('aria-pressed', 'true');
    await expect(discover.lineup.saveToggle('Luz Viva')).toHaveAccessibleName(
      'Remove Luz Viva from your saved artists',
    );
    await expect(discover.lineup.saveToggle('Elijah Park')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(discover.lineup.saveToggle('Elijah Park')).toHaveAccessibleName(
      'Save Elijah Park to your saved artists',
    );
    await expect(discover.lineup.headliner().saveToggle()).toHaveAccessibleName(
      'Remove Abigail Mensah from your saved artists',
    );
    await expect(discover.shell.savedLink()).toHaveAccessibleName('Saved 3 artists');
  });

  test('saving shows the toast with Undo, the first time says saved artists are private', async ({
    page,
  }) => {
    const discover = new DiscoverPage(page);
    const toasts = new Toasts(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await discover.openLink(BURLINGTON);
    await expect(discover.shell.savedLink()).toHaveAccessibleName('Saved');

    await discover.lineup.saveToggle('Elijah Park').click();

    await expect(discover.lineup.saveToggle('Elijah Park')).toHaveAttribute('aria-pressed', 'true');
    await expect(discover.shell.savedLink()).toHaveAccessibleName('Saved 1 artists');
    const saved = toasts.toast('Saved Elijah Park');
    await expect(saved.kind()).toHaveText('Saved');
    await expect(saved.text()).toHaveText('Your saved count is now 1.');
    const intro = toasts.toast('Saved artists are private');
    await expect(intro.text()).toHaveText(
      'Only you see who you save. They wait under Saved in the top bar.',
    );
    await expect(intro.action('View saved')).toHaveAttribute('href', '/saved');

    await saved.action('Undo').click();

    await expect(discover.lineup.saveToggle('Elijah Park')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(discover.shell.savedLink()).toHaveAccessibleName('Saved');
  });

  test('unsaving says so with the artist’s pronoun', async ({ page }) => {
    const discover = new DiscoverPage(page);
    const toasts = new Toasts(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await discover.openLink(BURLINGTON);
    await discover.lineup.saveToggle('Elijah Park').click();
    await expect(toasts.toast('Saved Elijah Park').locator()).toBeVisible();

    await discover.lineup.saveToggle('Elijah Park').click();

    const removed = toasts.toast('Removed Elijah Park');
    await expect(removed.kind()).toHaveText('Removed');
    await expect(removed.text()).toHaveText('He’s off your saved list. Your count is now 0.');
    await expect(removed.action('Undo')).toBeVisible();
  });

  test('a failed save reverts the heart and stays until dismissed or retried', async ({ page }) => {
    const discover = new DiscoverPage(page);
    const toasts = new Toasts(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await discover.openLink(BURLINGTON);
    await discover.failSaves();

    await discover.lineup.saveToggle('Elijah Park').click();

    const failed = toasts.toast('Couldn’t save Elijah Park. Try again.');
    await expect(failed.kind()).toHaveText('Failed');
    await expect(failed.text()).toHaveText('Your connection dropped, so his heart is empty again.');
    await expect(failed.progress()).toHaveCount(0);
    await expect(discover.lineup.saveToggle('Elijah Park')).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await page.unrouteAll();
    await failed.action('Try again').click();

    await expect(discover.lineup.saveToggle('Elijah Park')).toHaveAttribute('aria-pressed', 'true');
    await expect(failed.locator()).toHaveCount(0);
  });

  test('at 200 saved, the toast says so and nothing changes', async ({ page }) => {
    const discover = new DiscoverPage(page);
    const toasts = new Toasts(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await discover.openLink(BURLINGTON);
    await discover.limitSaves();

    await discover.lineup.saveToggle('Elijah Park').click();

    const limit = toasts.toast('You can save up to 200 artists.');
    await expect(limit.kind()).toHaveText('Heads up');
    await expect(limit.text()).toHaveText(
      'Remove someone from your saved list to make room for Elijah Park.',
    );
    await expect(limit.action('Open saved artists')).toHaveAttribute('href', '/saved');
    await expect(discover.lineup.saveToggle('Elijah Park')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('the profile has a Save button that turns to Saved', async ({ page }) => {
    const profile = new ArtistProfilePage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await profile.open('abigail-mensah', '2026-11-14');

    await expect(profile.saveButton()).toHaveText('Save');
    await expect(profile.saveButton()).toHaveAttribute('aria-pressed', 'false');
    await profile.saveButton().click();

    await expect(profile.saveButton()).toHaveText('Saved');
    await expect(profile.saveButton()).toHaveAttribute('aria-pressed', 'true');
  });

  test('an artist browsing sees no hearts', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await signInAs(page.context(), 'abigail');

    await discover.openLink(BURLINGTON);

    await expect(discover.lineup.ticketNames().first()).toBeVisible();
    await expect(discover.lineup.saveToggles()).toHaveCount(0);
    await expect(discover.shell.savedLink()).toHaveCount(0);
  });
});
