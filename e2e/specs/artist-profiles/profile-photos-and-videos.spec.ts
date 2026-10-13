import { expect, test } from '@playwright/test';
import { ArtistProfilePage } from '../../pages/artist-profile.page';
import { DiscoverPage } from '../../pages/discover.page';

// L2-014, L2-015, L2-020.1 (the empty state) and L2-020.3, with L2-098's gallery and video grids.
test.describe('Photos on a profile', () => {
  let profile: ArtistProfilePage;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
    await new DiscoverPage(page).freezeClock();
  });

  test('photos sit two to a row below MD and four from MD, named by their alt text', async () => {
    await profile.useWidth(375);
    await profile.open('abigail-mensah', '2026-11-14');

    await expect(profile.photosHeading()).toHaveText('Photos');
    await expect(profile.photoOpeners()).toHaveCount(4);
    await expect(profile.photoOpeners().first()).toHaveAccessibleName(
      'Open photo 1 of 4: Abigail at the microphone during a Sunday service',
    );
    await expect(profile.photoOpeners().nth(3)).toHaveAccessibleName(
      'Open photo 4 of 4: Abigail leading a youth night from the floor, not the stage',
    );
    expect(await profile.photoColumns()).toBe(2);

    await profile.useWidth(1024);
    expect(await profile.photoColumns()).toBe(4);
  });

  test('a photo opens full size in a viewer that pages, and Escape returns focus to it', async () => {
    await profile.open('abigail-mensah', '2026-11-14');
    const viewer = profile.photoViewer;

    await profile.openPhoto(1);

    await expect(viewer.dialog()).toBeVisible();
    await expect(viewer.title()).toHaveText('Photo 1 of 4');
    await expect(viewer.kicker()).toHaveText('Abigail Mensah · Photos');
    await expect(viewer.photo()).toHaveAccessibleName(
      'Abigail at the microphone during a Sunday service',
    );
    await expect(viewer.caption()).toHaveText('Abigail at the microphone during a Sunday service');
    await expect(viewer.closeButton()).toBeFocused();
    await expect(viewer.previousButton()).toBeDisabled();

    await viewer.next();
    await expect(viewer.title()).toHaveText('Photo 2 of 4');
    await expect(viewer.photo()).toHaveAccessibleName(
      'Abigail rehearsing with a church volunteer band',
    );
    await viewer.pressArrow('right');
    await viewer.pressArrow('right');
    await expect(viewer.title()).toHaveText('Photo 4 of 4');
    await expect(viewer.nextButton()).toBeDisabled();
    await viewer.pressArrow('left');
    await expect(viewer.title()).toHaveText('Photo 3 of 4');

    await viewer.closeWithEscape();
    await expect(viewer.dialog()).toBeHidden();
    await expect(profile.photoOpeners().first()).toBeFocused();
  });

  test('an artist with no photos shows the act-type illustration and no broken images', async () => {
    await profile.open('marcus-bell-trio');

    await expect(profile.photosHeading()).toHaveText('Photos');
    await expect(profile.photoOpeners()).toHaveCount(0);
    await expect(profile.galleryIllustration()).toHaveAccessibleName(
      'Band illustration: Marcus Bell Trio hasn’t added photos yet',
    );
    await expect(profile.galleryImages()).toHaveCount(0);
  });
});

test.describe('Videos on a profile', () => {
  let profile: ArtistProfilePage;

  test.beforeEach(async ({ page }) => {
    profile = new ArtistProfilePage(page);
    await new DiscoverPage(page).freezeClock();
  });

  test('"Watch her lead" shows the live videos, the first one large, and nothing plays', async () => {
    await profile.useWidth(1024);
    await profile.open('abigail-mensah', '2026-11-14');

    await expect(profile.videosHeading()).toHaveText('Watch her lead');
    await expect(profile.videoButtons()).toHaveCount(4);
    await expect(profile.videoButtons().first()).toHaveAccessibleName(
      'Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds',
    );
    await expect(profile.videoStamps()).toHaveText([
      'Play · 6:12',
      'Play · 4:40',
      'Play · 8:05',
      'Play · 5:30',
    ]);
    await expect(profile.videoCaptions()).toHaveText([
      'Way Maker — live at Bethel Pentecostal, Hamilton',
      'Great Is Thy Faithfulness — acoustic',
      'Twi praise medley — Harvest Sunday 2025',
      'Goodness of God — women’s retreat, Muskoka',
    ]);
    // The processing "Jireh" upload is not public.
    await expect(profile.videoButton('Jireh')).toHaveCount(0);
    const [first, second] = await profile.videoCellWidths();
    expect(first).toBeGreaterThan(second * 2.5);

    await expect(profile.players()).toHaveCount(0);
    expect(profile.playbackRequestsMade()).toEqual([]);
  });

  test('pressing play streams the video in place with controls and captions', async () => {
    await profile.open('abigail-mensah', '2026-11-14');

    await profile.playVideo('Way Maker');

    const player = profile.player('Way Maker');
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute('controls');
    await expect(player).not.toHaveAttribute('autoplay');
    await expect.poll(() => profile.isPlaying(player)).toBe(true);
    expect(await profile.focusedElementIs(player)).toBe(true);
    expect(await profile.captionTracks(player)).toEqual([
      { kind: 'captions', srclang: 'en', mode: 'showing' },
    ]);
    await expect(profile.videoButton('Way Maker')).toHaveCount(0);
  });

  test('a video without captions plays with no caption track', async () => {
    await profile.open('abigail-mensah', '2026-11-14');

    await profile.playVideo('Great Is Thy Faithfulness');

    const player = profile.player('Great Is Thy Faithfulness');
    await expect.poll(() => profile.isPlaying(player)).toBe(true);
    expect(await profile.captionTracks(player)).toEqual([]);
  });

  test('starting a second video pauses the first', async () => {
    await profile.open('abigail-mensah', '2026-11-14');
    await profile.playVideo('Way Maker');
    await expect.poll(() => profile.isPlaying(profile.player('Way Maker'))).toBe(true);

    await profile.playVideo('Great Is Thy Faithfulness');

    await expect
      .poll(() => profile.isPlaying(profile.player('Great Is Thy Faithfulness')))
      .toBe(true);
    expect(await profile.isPlaying(profile.player('Way Maker'))).toBe(false);
  });

  test('a browser without native HLS plays the stream through the streaming library', async () => {
    await profile.withoutNativeHls();
    await profile.open('abigail-mensah', '2026-11-14');
    expect(profile.playbackRequestsMade()).toEqual([]);

    await profile.playVideo('Way Maker');

    await expect.poll(() => profile.isPlaying(profile.player('Way Maker'))).toBe(true);
    expect(profile.playbackRequestsMade().some((path) => path.endsWith('.m3u8'))).toBe(true);
  });

  test('a stream that fails offers to try again', async () => {
    await profile.failStreams();
    await profile.open('abigail-mensah', '2026-11-14');

    await profile.playVideo('Way Maker');

    await expect(profile.videoFailure()).toHaveText(
      'This video didn’t load. Press play to try again.',
    );
    await expect(profile.videoButton('Way Maker')).toBeFocused();
    await expect(profile.players()).toHaveCount(0);
  });

  test('an artist with no videos keeps the section with "No videos yet"', async () => {
    await profile.open('marcus-bell-trio');

    await expect(profile.videosHeading()).toHaveText('Watch them lead');
    await expect(profile.videosEmptyState()).toContainText('No videos yet');
    await expect(profile.videoButtons()).toHaveCount(0);
  });
});
