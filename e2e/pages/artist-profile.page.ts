import type { Locator, Page } from '@playwright/test';
import { PhotoViewerDialog } from './photo-viewer.dialog';
import { Shell } from './shell';

/** An artist's public profile at `/artists/{slug}` (docs/mocks/pages/artist). */
export class ArtistProfilePage {
  readonly shell: Shell;
  readonly photoViewer: PhotoViewerDialog;
  /** Paths of the video manifests, segments and captions the browser fetched. */
  private readonly playbackRequests: string[] = [];

  constructor(private readonly page: Page) {
    this.shell = new Shell(page);
    this.photoViewer = new PhotoViewerDialog(page);
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (/\.(m3u8|ts|vtt)$/.test(path)) this.playbackRequests.push(path);
    });
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

  async useWidth(width: number): Promise<void> {
    await this.page.setViewportSize({ width, height: 800 });
  }

  // Photos (L2-015, L2-020.3)

  private photosSection(): Locator {
    return this.page.locator('[aria-labelledby="photos-title"]');
  }

  photosHeading(): Locator {
    return this.page.locator('#photos-title');
  }

  /** One control per photo, named "Open photo 1 of 4: {alt text}". */
  photoOpeners(): Locator {
    return this.photosSection().getByRole('button', { name: /^Open photo/ });
  }

  async openPhoto(position: number): Promise<void> {
    await this.photoOpeners()
      .nth(position - 1)
      .click();
  }

  /** How many columns the photo grid lays out. */
  async photoColumns(): Promise<number> {
    return this.photosSection()
      .locator('.photo-grid')
      .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
  }

  /** The act-type illustration that stands in when there are no photos. */
  galleryIllustration(): Locator {
    return this.photosSection().getByRole('img');
  }

  galleryImages(): Locator {
    return this.photosSection().locator('img');
  }

  // Videos (L2-014, L2-020.1)

  private videosSection(): Locator {
    return this.page.locator('[aria-labelledby="videos-title"]');
  }

  videosHeading(): Locator {
    return this.page.locator('#videos-title');
  }

  /** One button per video, named "Play {title}, {duration in words}". */
  videoButtons(): Locator {
    return this.videosSection().getByRole('button', { name: /^Play / });
  }

  videoButton(title: string): Locator {
    return this.videosSection().getByRole('button', { name: new RegExp(`^Play ${title}`) });
  }

  videoStamps(): Locator {
    return this.videosSection().locator('.video__play');
  }

  videoCaptions(): Locator {
    return this.videosSection().locator('.video__caption');
  }

  /** Widths of the video grid's cells, in order. */
  async videoCellWidths(): Promise<number[]> {
    return this.videosSection()
      .locator('.media-grid > li')
      .evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().width));
  }

  async playVideo(title: string): Promise<void> {
    await this.videoButton(title).click();
  }

  players(): Locator {
    return this.videosSection().locator('video.video__player');
  }

  /** The `<video>` that plays `title` in place of its button. */
  player(title: string): Locator {
    return this.videosSection()
      .getByRole('listitem')
      .filter({ hasText: title })
      .locator('video.video__player');
  }

  async isPlaying(player: Locator): Promise<boolean> {
    return player.evaluate(
      (video: HTMLVideoElement) => !video.paused && video.currentTime > 0 && !video.ended,
    );
  }

  /** The player's caption tracks as `{kind, srclang, mode}`. */
  async captionTracks(player: Locator): Promise<{ kind: string; srclang: string; mode: string }[]> {
    return player.evaluate((video: HTMLVideoElement) =>
      [...video.querySelectorAll('track')].map((track) => ({
        kind: track.kind,
        srclang: track.srclang,
        mode: track.track.mode,
      })),
    );
  }

  async focusedElementIs(locator: Locator): Promise<boolean> {
    return locator.evaluate((element) => element === document.activeElement);
  }

  videoFailure(): Locator {
    return this.videosSection().locator('.inline-msg--danger');
  }

  videosEmptyState(): Locator {
    return this.videosSection().locator('.empty');
  }

  /** Video manifests, segments and captions fetched so far. */
  playbackRequestsMade(): string[] {
    return [...this.playbackRequests];
  }

  /** Every video manifest fails to load. */
  async failStreams(): Promise<void> {
    await this.page.route('**/*.m3u8', (route) => route.fulfill({ status: 404, body: '' }));
  }

  /** Behaves like a browser that cannot play HLS by itself, so the streaming library is used. */
  async withoutNativeHls(): Promise<void> {
    await this.page.addInitScript(() => {
      const canPlayType = HTMLMediaElement.prototype.canPlayType;
      HTMLMediaElement.prototype.canPlayType = function (type: string) {
        return /mpegurl/i.test(type) ? '' : canPlayType.call(this, type);
      };
    });
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
