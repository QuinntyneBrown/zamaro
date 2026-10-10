import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ARTIST_PROFILES_API,
  ArtistNotFound,
  type ArtistProfile,
  type CarriedSearch,
  type SimilarArtists,
} from 'api';
import type { Subscription } from 'rxjs';
import { HttpStatus } from '../../shared/http-status';

export type ProfileStatus = 'loading' | 'loaded' | 'missing' | 'error';

/** Skeletons appear only when the profile takes longer than this (L2-105.1). */
export const SKELETON_DELAY_MS = 300;

/**
 * One artist's public profile: loading, loaded, failed with Try again (L2-107), or missing with
 * similar artists (L2-021). A renamed artist's old address moves to the current one with a 301.
 */
@Injectable()
export class ArtistProfileStore {
  private readonly api = inject(ARTIST_PROFILES_API);
  private readonly router = inject(Router);
  private readonly httpStatus = inject(HttpStatus);

  readonly profile = signal<ArtistProfile | null>(null);
  readonly status = signal<ProfileStatus>('loading');
  /** True once the profile has been loading for 300 ms: show skeletons, mark the page busy. */
  readonly showSkeletons = signal(false);
  /** Who to offer instead when the artist is missing. */
  readonly similarArtists = signal<SimilarArtists | null>(null);

  private slug = '';
  private search: CarriedSearch = {};
  private request?: Subscription;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.request?.unsubscribe();
      clearTimeout(this.timer);
    });
  }

  load(slug: string, search: CarriedSearch = {}): void {
    this.slug = slug;
    this.search = search;
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
    this.request = this.api.get(this.slug, this.search).subscribe({
      next: (profile) => {
        if (profile.slug !== this.slug) {
          this.move(profile.slug);
          return;
        }
        this.profile.set(profile);
        this.settle('loaded');
      },
      error: (error: unknown) => {
        if (error instanceof ArtistNotFound) {
          this.similarArtists.set(error.similarArtists);
          this.httpStatus.set(404);
          this.settle('missing');
          return;
        }
        this.settle('error');
      },
    });
  }

  /**
   * The address is a retired slug: the server answers 301 to the current one, the browser replaces
   * the address; the query string is kept (L2-021.3, L2-055.3). The profile loads again there.
   */
  private move(slug: string): void {
    this.httpStatus.set(301);
    void this.router.navigate(['/artists', slug], {
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  }

  private settle(status: ProfileStatus): void {
    clearTimeout(this.timer);
    this.showSkeletons.set(false);
    this.status.set(status);
  }
}
