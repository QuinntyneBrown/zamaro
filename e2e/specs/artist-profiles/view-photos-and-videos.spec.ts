import { expect, test } from '@playwright/test';
import { cast } from '../../fixtures/cast';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { PhotoViewerDialog } from '../../pages/photo-viewer.dialog';

// L2-014, L2-015, L2-020.3, L2-098 (gallery columns).
test.describe('Photos and videos on a profile', () => {
  let profile: ArtistProfilePage;
  let viewer: PhotoViewerDialog;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
    viewer = new PhotoViewerDialog(page);
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

  test('a photo opens full size in a dialog that pages with buttons and arrow keys', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await profile.photo(1).click();

    await expect(viewer.dialog()).toHaveAccessibleName('Photo 1 of 4');
    await expect(viewer.kicker()).toHaveText('Abigail Mensah · Photos');
    await expect(viewer.image()).toHaveAttribute(
      'alt',
      'Abigail at the microphone during a Sunday service',
    );
    await expect(viewer.closeButton()).toBeFocused();
    await expect(viewer.previousButton()).toBeDisabled();

    await viewer.next();
    await expect(viewer.title()).toHaveText('Photo 2 of 4');
    await expect(viewer.image()).toHaveAttribute(
      'alt',
      'Abigail rehearsing with a church volunteer band',
    );
    await viewer.press('ArrowRight');
    await viewer.press('ArrowRight');
    await expect(viewer.title()).toHaveText('Photo 4 of 4');
    await expect(viewer.nextButton()).toBeDisabled();
    await viewer.press('ArrowLeft');
    await expect(viewer.title()).toHaveText('Photo 3 of 4');
  });

  test('when Previous reaches the first photo, focus moves to Next instead of being lost', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await profile.photo(2).click();
    await viewer.previous();

    await expect(viewer.title()).toHaveText('Photo 1 of 4');
    await expect(viewer.nextButton()).toBeFocused();
  });

  test('Escape closes the viewer and focus returns to the photo that opened it', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await profile.photo(2).click();
    await viewer.next();
    await viewer.press('Escape');

    await expect(viewer.dialog()).toHaveCount(0);
    await expect(profile.photo(2)).toBeFocused();
  });

  test('"Watch her lead" shows each video with its poster, stamp and caption, and nothing plays', async () => {
    const mediaRequests = profile.watchMediaRequests();
    await profile.setViewport(1024);
    await profile.open(cast.artists.headliner.slug, cast.search.date);

    await expect(profile.videosHeading()).toHaveText('Watch her lead');
    await expect(profile.videoButtons()).toHaveCount(4);
    const wayMaker = profile.videoCard('Way Maker — live at Bethel Pentecostal, Hamilton');
    await expect(wayMaker.playButton()).toHaveAccessibleName(
      'Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds',
    );
    await expect(wayMaker.stamp()).toHaveText('Play · 6:12');
    await expect(profile.videoCard('Twi praise medley').stamp()).toHaveText('Play · 8:05');
    // The first is featured across the row; the rest sit three across under it (L2-098.2).
    const first = await wayMaker.box();
    const second = await profile.videoCard('Great Is Thy Faithfulness').box();
    expect(first.width).toBeGreaterThan(second.width * 2.5);
    await expect(profile.players()).toHaveCount(0);
    expect(mediaRequests()).toBe(0);
  });

  test('a video plays in place with controls and captions when it is pressed', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);
    const wayMaker = profile.videoCard('Way Maker — live at Bethel Pentecostal, Hamilton');
    const before = await wayMaker.box();

    await wayMaker.play();

    expect(await wayMaker.isPlaying()).toBe(true);
    await expect(wayMaker.player()).toHaveAttribute('controls', '');
    await expect(wayMaker.player()).not.toHaveAttribute('autoplay');
    await expect(wayMaker.player()).toBeFocused();
    await expect(wayMaker.playButton()).toHaveCount(0);
    await expect(wayMaker.captionsTrack()).toHaveAttribute('srclang', 'en');
    expect(await wayMaker.captionsMode()).toBe('showing');
    expect(await wayMaker.box()).toEqual(before);
  });

  test('a video without captions has no captions track, and only one video plays at a time', async () => {
    await profile.open(cast.artists.headliner.slug, cast.search.date);
    const wayMaker = profile.videoCard('Way Maker');
    const medley = profile.videoCard('Twi praise medley');

    await wayMaker.play();
    expect(await wayMaker.isPlaying()).toBe(true);
    await medley.play();

    expect(await medley.isPlaying()).toBe(true);
    await expect(medley.captionsTrack()).toHaveCount(0);
    expect(await wayMaker.isPaused()).toBe(true);
  });

  test('a stream that fails to load says so, and pressing play tries again', async () => {
    await profile.failStreams();
    await profile.open(cast.artists.headliner.slug, cast.search.date);
    const wayMaker = profile.videoCard('Way Maker');

    await wayMaker.play();

    await expect(wayMaker.failure()).toHaveText(
      'This video didn’t load. Press play to try again.',
    );
    await expect(wayMaker.playButton()).not.toHaveAttribute('aria-busy');
    await expect(wayMaker.playButton()).toBeFocused();
    await expect(profile.players()).toHaveCount(0);
  });

  test('with no videos, the section keeps its place and says so', async () => {
    await profile.open('miriam-haile');

    await expect(profile.videosHeading()).toHaveText('Watch her lead');
    await expect(profile.videosEmpty()).toContainText('No videos yet');
    await expect(profile.videosEmpty()).toContainText(
      'Miriam hasn’t added a video yet. Until then, ask her for a recording in your request.',
    );
    await expect(profile.videoButtons()).toHaveCount(0);
  });
});
