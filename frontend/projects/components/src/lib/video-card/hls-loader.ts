import { InjectionToken } from '@angular/core';

/** Plays an HLS stream in a `<video>` for browsers that cannot play HLS natively. */
export interface HlsAttacher {
  /** Resolves once the manifest is read; rejects when the stream cannot be loaded. */
  attach(video: HTMLVideoElement, url: string): Promise<void>;
  destroy(): void;
}

/** Loads hls.js on the first press, in its own chunk (ADR-0009). */
async function loadHlsJs(): Promise<HlsAttacher> {
  const { default: Hls } = await import('hls.js');
  const hls = new Hls();
  return {
    attach: (video, url) =>
      new Promise<void>((resolve, reject) => {
        hls.on(Hls.Events.MANIFEST_PARSED, () => resolve());
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) reject(new Error(data.details));
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      }),
    destroy: () => hls.destroy(),
  };
}

/** How `zm-video-card` gets an HLS player; tests and the perf-test app bind a fake. */
export const ZM_HLS_LOADER = new InjectionToken<() => Promise<HlsAttacher>>('ZM_HLS_LOADER', {
  providedIn: 'root',
  factory: () => loadHlsJs,
});
