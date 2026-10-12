import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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

/** A captions file the artist supplied, as a `<track kind="captions">`. */
export interface VideoCaptions {
  src: string;
  srclang: string;
  label: string;
}

/** No `playing` within this long of a press is a failure (CRD D-7). */
const PLAY_TIMEOUT_MS = 10_000;
let nextId = 0;

/**
 * One clip in a profile's "Watch her lead" section (docs/specs/components/video-card.md): the poster
 * frame with a "Play · 6:12" stamp and a caption. A press streams it in place in the same 16:9
 * frame with the browser's controls and the artist's captions; nothing loads or plays before the
 * press (L2-014, L2-087). The button stays, busy, until the clip plays, so a failure can fall back
 * to it with focus kept. Manage mode (Edit profile) arrives with the artist workspace (M4).
 */
@Component({
  selector: 'zm-video-card',
  imports: [Artwork, Icon],
  templateUrl: './video-card.html',
  styleUrl: './video-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCard {
  /** Song and setting: "Way Maker — live at Bethel Pentecostal, Hamilton". */
  readonly caption = input.required<string>();
  /** The visible stamp: "Play · 6:12". */
  readonly stampText = input('');
  /** The button's name, starting with the stamp's first word: "Play Way Maker, …, 6 minutes 12 seconds". */
  readonly label = input('');
  readonly artVariant = input<'solo' | 'group'>('solo');
  readonly artTilt = input(false, { transform: booleanAttribute });
  readonly artYellow = input(false, { transform: booleanAttribute });
  readonly artLabel = input.required<string>();
  /** The poster frame; null keeps the halftone. */
  readonly poster = input<ArtworkPhoto | null>(null);
  /** The HLS manifest. */
  readonly stream = input<string | null>(null);
  readonly captions = input<VideoCaptions | null>(null);
  /** "This video didn't load. Press play to try again." */
  readonly errorText = input('');

  readonly played = output<void>();
  readonly failed = output<void>();

  protected readonly playback = inject(VideoPlayback);
  private readonly loadHls = inject(ZM_HLS_LOADER);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly player = viewChild<ElementRef<HTMLVideoElement>>('player');

  protected readonly state = signal<'idle' | 'busy' | 'playing'>('idle');
  /** Set by a failure; cleared once the clip plays. */
  protected readonly hasFailed = signal(false);
  protected readonly errorId = `zm-video-error-${nextId++}`;

  private attacher: HlsAttacher | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected play(): void {
    if (this.state() !== 'idle') return;
    this.state.set('busy');
    this.timer = setTimeout(() => this.fail(), PLAY_TIMEOUT_MS);
    // The hidden <video> renders with the busy state; start it as soon as it exists.
    this.afterRender(() => void this.start());
  }

  private async start(): Promise<void> {
    const video = this.player()?.nativeElement;
    const stream = this.stream();
    if (!video || !stream) return this.fail();
    try {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else {
        this.attacher = await this.loadHls();
        if (this.state() !== 'busy') return;
        await this.attacher.attach(video, stream);
      }
      if (this.state() !== 'busy') return;
      await video.play();
    } catch {
      this.fail();
    }
  }

  protected onPlaying(video: HTMLVideoElement): void {
    this.playback.started(video);
    if (this.state() !== 'busy') return;
    clearTimeout(this.timer);
    this.state.set('playing');
    this.hasFailed.set(false);
    this.afterRender(() => video.focus());
    this.played.emit();
  }

  protected fail(): void {
    if (this.state() !== 'busy') return;
    this.stop();
    this.state.set('idle');
    this.hasFailed.set(true);
    this.failed.emit();
    this.afterRender(() =>
      this.host.nativeElement.querySelector<HTMLButtonElement>('.video')?.focus(),
    );
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }

  private stop(): void {
    clearTimeout(this.timer);
    const video = this.player()?.nativeElement;
    if (video) {
      video.pause();
      this.playback.stopped(video);
    }
    this.attacher?.destroy();
    this.attacher = null;
  }
}
