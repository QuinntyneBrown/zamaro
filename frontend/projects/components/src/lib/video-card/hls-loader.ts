import { InjectionToken } from '@angular/core';

/** Plays an HLS manifest through Media Source Extensions in a browser without native HLS. */
export interface HlsAttacher {
  /** Resolves once the manifest is parsed and the video can be played. */
  attach(video: HTMLVideoElement, url: string): Promise<void>;
  destroy(): void;
}

export type HlsLoader = () => Promise<HlsAttacher>;

/**
 * Loads the streaming library on demand (ADR-0010). The default does a dynamic `import('hls.js')`,
 * so the library sits in its own chunk and is fetched only on the first press in a browser that
 * cannot play HLS by itself. Tests and the perf-test app bind a fake.
 */
export const ZM_HLS_LOADER = new InjectionToken<HlsLoader>('ZM_HLS_LOADER', {
  providedIn: 'root',
  factory: () => loadHlsJs,
});

async function loadHlsJs(): Promise<HlsAttacher> {
  const { default: Hls } = await import('hls.js');
  // Start on a rendition that fits the frame, so playback starts quickly (L2-088).
  const hls = new Hls({ capLevelToPlayerSize: true });
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
