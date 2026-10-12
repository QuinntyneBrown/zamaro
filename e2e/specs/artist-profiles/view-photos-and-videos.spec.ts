import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { ArtistProfilePage } from '../../pages/artist-profile.page';

// L2-014, L2-015, L2-020.3, L2-098 (gallery columns).
test.describe('Photos and videos on a profile', () => {
  let profile: ArtistProfilePage;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
  });

  test('the gallery shows each photo with its alt text, 2 across below MD and 4 from MD', async () => {
    await profile.setViewport(375);
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await expect(profile.photoLinks()).toHaveCount(4);
    await expect(profile.photo(1)).toHaveAccessibleName(
      'Open photo 1 of 4: Abigail at the microphone during a Sunday service',
    );
    await expect(profile.photo(4)).toHaveAccessibleName(
      'Open photo 4 of 4: Abigail leading a youth night from the floor, not the stage',
    );
    expect(await profile.loadedPhotos()).toBe(4);
    expect(await profile.galleryColumns()).toBe(2);

    await profile.setViewport(1024);
    expect(await profile.galleryColumns()).toBe(4);
  });

  test('with no photos, the gallery keeps its place with the act-type illustration', async () => {
    await profile.open('elijah-park');

    await expect(profile.galleryIllustration()).toHaveAccessibleName(
      'Solo vocalist illustration: Elijah hasn’t added photos yet',
    );
    await expect(profile.photoLinks()).toHaveCount(0);
    expect(await profile.brokenImages()).toBe(0);
  });

  test('a group with no photos gets the group illustration', async () => {
    await profile.open('marcus-bell-trio');

    await expect(profile.galleryIllustration()).toHaveAccessibleName(
      'Band illustration: Marcus Bell Trio hasn’t added photos yet',
    );
  });
});
