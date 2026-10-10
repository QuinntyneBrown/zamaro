import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ARTIST_PROFILES_API, type ArtistProfile } from 'api';
import type { Subscription } from 'rxjs';

export type ProfileStatus = 'loading' | 'loaded' | 'error';

/** Skeletons appear only when the profile takes longer than this (L2-105.1). */
export const SKELETON_DELAY_MS = 300;

/** One artist's public profile: loading, loaded, or failed with Try again (L2-107). */
@Injectable()
export class ArtistProfileStore {
  private readonly api = inject(ARTIST_PROFILES_API);

  readonly profile = signal<ArtistProfile | null>(null);
  readonly status = signal<ProfileStatus>('loading');
  /** True once the profile has been loading for 300 ms: show skeletons, mark the page busy. */
  readonly showSkeletons = signal(false);

  private slug = '';
  private request?: Subscription;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.request?.unsubscribe();
      clearTimeout(this.timer);
    });
  }

  load(slug: string): void {
    this.slug = slug;
    this.run();
  }

  retry(): void {
    this.run();
  }

  private run(): void {
    this.request?.unsubscribe();
    clearTimeout(this.timer);
    this.status.set('loading');
    this.timer = setTimeout(() => this.showSkeletons.set(true), SKELETON_DELAY_MS);
    this.request = this.api.get(this.slug).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.settle('loaded');
      },
      error: () => this.settle('error'),
    });
  }

  private settle(status: ProfileStatus): void {
    clearTimeout(this.timer);
    this.showSkeletons.set(false);
    this.status.set(status);
  }
}
