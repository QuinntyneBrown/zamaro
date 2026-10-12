import type { Locator, Page } from '@playwright/test';
import { Shell } from './shell';

/** An artist's public profile at `/artists/{slug}` (docs/mocks/pages/artist). */
export class ArtistProfilePage {
  readonly shell: Shell;

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
  }

  async open(slug: string, date?: string): Promise<void> {
    await this.page.goto(`/artists/${slug}${date ? `?date=${date}` : ''}`, {
      waitUntil: 'networkidle',
    });
  }

  /** Replaces part of the profile the API returns, for the next loads made by the browser. */
  async alterProfile(slug: string, change: Record<string, unknown>): Promise<void> {
    await this.page.route(`**/api/v1/artists/${slug}`, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      await route.fulfill({
        response,
        json: { data: { ...body.data, ...change } },
      });
    });
  }

  async failProfile(slug: string): Promise<void> {
    await this.page.route(`**/api/v1/artists/${slug}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: '{}',
      }),
    );
  }

  async delayProfile(slug: string, ms: number): Promise<void> {
    await this.page.route(`**/api/v1/artists/${slug}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.continue();
    });
  }

  async restoreProfile(slug: string): Promise<void> {
    await this.page.unroute(`**/api/v1/artists/${slug}`);
  }

  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'networkidle' });
  }

  breadcrumbBack(): Locator {
    return this.page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link');
  }

  name(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  kicker(): Locator {
    return this.page.locator('.artist-poster .poster__kicker');
  }

  /** Each fact in the header, in order: rating, review count, base city, drive limit. */
  facts(): Locator {
    return this.page.locator('.artist-poster__facts > *');
  }

  rating(): Locator {
    return this.page.locator('.artist-poster__facts').getByRole('img');
  }

  bookButton(): Locator {
    return this.page.getByRole('button', { name: /^(Book for|Check dates)/ });
  }

  aboutHeading(): Locator {
    return this.page.locator('#about-title');
  }

  aboutParagraphs(): Locator {
    return this.page.locator('[aria-labelledby="about-title"] .section__body p');
  }

  setlistHeading(): Locator {
    return this.page.locator('#songs-title');
  }

  setlistNote(): Locator {
    return this.page.locator('[aria-labelledby="songs-title"] .section__head > p');
  }

  songs(): Locator {
    return this.page.locator('[aria-labelledby="songs-title"]').getByRole('listitem');
  }

  /** The "Photos" section (docs/mocks/pages/artist): one link per photo, or the illustration. */
  photosSection(): Locator {
    return this.page.locator('[aria-labelledby="photos-title"]');
  }

  /** The gallery's photo links, named "Open photo 1 of 4: {alt text}". */
  photoLinks(): Locator {
    return this.photosSection().getByRole('link', { name: /^Open photo/ });
  }

  photo(position: number): Locator {
    return this.photosSection().getByRole('link', { name: new RegExp(`^Open photo ${position} of`) });
  }

  /** The act-type illustration that stands in for an empty gallery (L2-020.3). */
  galleryIllustration(): Locator {
    return this.photosSection().getByRole('img');
  }

  /** How many columns the gallery lays its items out in. */
  async galleryColumns(): Promise<number> {
    return this.photosSection()
      .locator('.photo-grid > *')
      .evaluateAll(
        (items) => new Set(items.map((item) => Math.round(item.getBoundingClientRect().left))).size,
      );
  }

  /** Images on the whole page that failed to load (a broken image icon). */
  async brokenImages(): Promise<number> {
    return this.page
      .locator('img')
      .evaluateAll(
        (images) =>
          (images as HTMLImageElement[]).filter((image) => image.complete && image.naturalWidth === 0)
            .length,
      );
  }

  /** Waits until every photo in the gallery has decoded, and returns how many have. */
  async loadedPhotos(): Promise<number> {
    const images = this.photosSection().locator('img');
    await images.evaluateAll((all) =>
      Promise.all((all as HTMLImageElement[]).map((image) => image.decode().catch(() => undefined))),
    );
    return images.evaluateAll(
      (all) => (all as HTMLImageElement[]).filter((image) => image.naturalWidth > 0).length,
    );
  }

  async setViewport(width: number): Promise<void> {
    await this.page.setViewportSize({ width, height: 900 });
  }

  /** The "Watch her lead" section (docs/mocks/pages/artist). */
  videosSection(): Locator {
    return this.page.locator('[aria-labelledby="videos-title"]');
  }

  videosHeading(): Locator {
    return this.page.locator('#videos-title');
  }

  /** The play buttons, named "Play Way Maker, live at …, 6 minutes 12 seconds". */
  videoButtons(): Locator {
    return this.videosSection().getByRole('button', { name: /^Play / });
  }

  /** A video card by its caption, "Way Maker — live at Bethel Pentecostal, Hamilton". */
  videoCard(caption: string): VideoCardPart {
    return new VideoCardPart(
      this.videosSection().locator('zm-video-card').filter({ hasText: caption }),
    );
  }

  /** The `<video>` players on the page; none exist until a video is played. */
  players(): Locator {
    return this.page.locator('video');
  }

  /** The "No videos yet" empty state. */
  videosEmpty(): Locator {
    return this.videosSection().getByRole('status');
  }

  /** Answers requests for video streams with a 404, as a stream that failed would. */
  async failStreams(): Promise<void> {
    await this.page.route('**/*.m3u8', (route) => route.fulfill({ status: 404, body: '' }));
  }

  /** How many stream manifests or caption files the page has requested so far. */
  watchMediaRequests(): () => number {
    let count = 0;
    this.page.on('request', (request) => {
      if (/\.(m3u8|m4s|vtt)$/.test(new URL(request.url()).pathname)) count++;
    });
    return () => count;
  }

  /** The loading region and its status line. */
  busyRegion(): Locator {
    return this.page.locator('[aria-busy="true"]');
  }

  loadingStatus(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Loading the artist’s profile…' });
  }

  errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  async tryAgain(): Promise<void> {
    await this.errorAlert().getByRole('button', { name: 'Try again' }).click();
  }

  backToLineup(): Locator {
    return this.errorAlert().getByRole('link', { name: 'Back to the lineup' });
  }

  /** True when a script in the page set `window.zmPwned`. */
  async scriptRan(): Promise<boolean> {
    return this.page.evaluate(() => 'zmPwned' in window);
  }
}

/** One video card in the videos section. */
export class VideoCardPart {
  constructor(private readonly root: Locator) {}

  playButton(): Locator {
    return this.root.locator('button.video');
  }

  stamp(): Locator {
    return this.root.locator('.video__play');
  }

  caption(): Locator {
    return this.root.locator('.video__caption');
  }

  player(): Locator {
    return this.root.locator('video.video__player');
  }

  captionsTrack(): Locator {
    return this.player().locator('track[kind="captions"]');
  }

  failure(): Locator {
    return this.root.getByRole('status');
  }

  async play(): Promise<void> {
    await this.playButton().click();
  }

  /** Resolves once the player has advanced past the start. */
  async isPlaying(): Promise<boolean> {
    return this.player().evaluate(
      (video: HTMLVideoElement) =>
        new Promise<boolean>((resolve) => {
          const check = () => {
            if (!video.paused && video.currentTime > 0) resolve(true);
            else setTimeout(check, 50);
          };
          check();
        }),
    );
  }

  async isPaused(): Promise<boolean> {
    return this.player().evaluate((video: HTMLVideoElement) => video.paused);
  }

  /** The mode of the player's captions track: "showing" when captions are on. */
  async captionsMode(): Promise<string> {
    return this.player().evaluate(
      (video: HTMLVideoElement) => video.textTracks[0]?.mode ?? 'none',
    );
  }

  /** The card's box in page coordinates, so scrolling does not change it. */
  async box(): Promise<{ x: number; y: number; width: number; height: number }> {
    return this.root.evaluate((card) => {
      const rect = card.getBoundingClientRect();
      return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      };
    });
  }
}
