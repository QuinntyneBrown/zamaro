import { Injectable } from '@angular/core';

/** One clip at a time: a video that starts playing pauses whichever was playing (L2-014). */
@Injectable({ providedIn: 'root' })
export class VideoPlayback {
  private current: HTMLVideoElement | null = null;

  started(video: HTMLVideoElement): void {
    if (this.current && this.current !== video) this.current.pause();
    this.current = video;
  }

  stopped(video: HTMLVideoElement): void {
    if (this.current === video) this.current = null;
  }
}
