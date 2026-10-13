import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Artwork, type ArtworkPhoto } from '../artwork/artwork';
import { Icon } from '../icon/icon';
import { type HlsAttacher, ZM_HLS_LOADER } from './hls-loader';
import { VideoPlayback } from './video-playback';

export interface VideoCaptions {
  src: string;
  srclang: string;
  /** The track's name in the player's captions menu: "English". */
  label: string;
}

type PlayState = 'idle' | 'busy' | 'playing' | 'failed';

/** Nothing playing this long after a press is a failure (CRD D-7). */
const START_TIMEOUT_MS = 10_000;

let nextId = 0;

/**
 * One clip in "Watch her lead" (docs/specs/components/video-card.md): a wide thumbnail with a
 * "Play · 6:12" stamp. Pressing it streams the clip in place, in the same 16:9 frame, with native
 * controls and the artist's captions; it never autoplays (L2-014). The `<video>` is created on the
 * first press, native HLS is used where the browser has it, and `ZM_HLS_LOADER` otherwise.
 */
@Component({
  selector: 'zm-video-card',
  imports: [Artwork, Icon],
  templateUrl: './video-card.html',
  styleUrl: './video-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCard {
  /** "Way Maker — live at Bethel Pentecostal, Hamilton"; also names the player. */
  readonly caption = input.required<string>();
  /** The visible stamp: "Play · 6:12". */
  readonly stampText = input('');
  /** The button's name, starting with the stamp's first word: "Play Way Maker, …, 6 minutes 12 seconds". */
  readonly label = input('');
  readonly artVariant = input<'solo' | 'group'>('solo');
  readonly artTilt = input(false, { transform: booleanAttribute });
  readonly artYellow = input(false, { transform: booleanAttribute });
  /** Describes the thumbnail. */
  readonly artLabel = input.required<string>();
  /** The poster frame; null keeps the halftone. */
  readonly poster = input<ArtworkPhoto | null>(null);
  /** The HLS manifest URL. */
  readonly stream = input<string | null>(null);
  readonly captions = input<VideoCaptions | null>(null);
  /** "This video didn't load. Press play to try again." */
  readonly errorText = input('');

  /** The clip's first `playing` after a press. */
  readonly played = output<void>();
  /** Loading failed or stalled, once per attempt. */
  readonly failed = output<void>();

  private readonly playback = inject(VideoPlayback);
  private readonly loadHls = inject(ZM_HLS_LOADER);
  private readonly injector = inject(Injector);
  private readonly player = viewChild<ElementRef<HTMLVideoElement>>('player');

  protected readonly errorId = `zm-video-error-${nextId++}`;
  protected readonly state = signal<PlayState>('idle');
  /** Shown from a failure until the clip finally plays. */
  protected readonly showError = signal(false);
  protected readonly hasPlayer = computed(
    () => this.state() === 'busy' || this.state() === 'playing',
  );

  private attacher?: HlsAttacher;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.attacher?.destroy();
      const video = this.player()?.nativeElement;
      if (video) {
        video.pause();
        this.playback.stopped(video);
      }
    });
  }

  protected play(): void {
    if (this.state() === 'busy' || !this.stream()) return;
    this.state.set('busy');
    // The hidden <video> exists after this render; the press's user activation still holds then.
    afterNextRender(() => void this.start(), { injector: this.injector });
  }

  protected onPlaying(video: HTMLVideoElement): void {
    if (this.state() !== 'busy') return;
    clearTimeout(this.timer);
    this.state.set('playing');
    this.showError.set(false);
    this.played.emit();
    // The button is gone; focus follows the clip rather than falling to <body>.
    afterNextRender(() => video.focus(), { injector: this.injector });
  }

  protected onPlay(video: HTMLVideoElement): void {
    this.playback.started(video);
  }

  protected fail(): void {
    if (this.state() !== 'busy') return;
    clearTimeout(this.timer);
    this.attacher?.destroy();
    this.attacher = undefined;
    this.state.set('failed');
    this.showError.set(true);
    this.failed.emit();
  }

  private async start(): Promise<void> {
    const video = this.player()?.nativeElement;
    const stream = this.stream();
    if (!video || !stream) return;
    this.timer = setTimeout(() => this.fail(), START_TIMEOUT_MS);
    try {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else {
        this.attacher = await this.loadHls();
        await this.attacher.attach(video, stream);
      }
      await video.play();
    } catch {
      this.fail();
    }
  }
}
