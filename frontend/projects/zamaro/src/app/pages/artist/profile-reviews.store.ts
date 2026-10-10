import { computed, DestroyRef, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { REVIEWS_API } from 'api';
import type { Subscription } from 'rxjs';
import { ArtistProfileStore } from './artist-profile.store';

/**
 * The profile's reviews (L2-018): the newest ones arrive with the profile, and each "Show all" or
 * "Show 10 more" appends the next page, newest first. A new profile starts the list again.
 */
@Injectable()
export class ProfileReviewsStore {
  private readonly api = inject(REVIEWS_API);
  private readonly profiles = inject(ArtistProfileStore);

  readonly reviews = linkedSignal(() => this.profiles.profile()?.reviews.items ?? []);
  readonly nextCursor = linkedSignal(() => this.profiles.profile()?.reviews.nextCursor ?? null);
  readonly total = computed(() => this.profiles.profile()?.reviews.total ?? 0);
  readonly loadingMore = signal(false);

  private request?: Subscription;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  /** Appends the next page; resolves to how many reviews arrived (0 on failure, as Discover does). */
  loadMore(): Promise<number> {
    const profile = this.profiles.profile();
    const cursor = this.nextCursor();
    if (!profile || !cursor || this.loadingMore()) return Promise.resolve(0);
    this.loadingMore.set(true);
    return new Promise((resolve) => {
      this.request = this.api.list(profile.slug, cursor).subscribe({
        next: (page) => {
          this.loadingMore.set(false);
          if (this.profiles.profile() !== profile) return resolve(0);
          this.reviews.update((reviews) => [...reviews, ...page.reviews]);
          this.nextCursor.set(page.nextCursor);
          resolve(page.reviews.length);
        },
        error: () => {
          this.loadingMore.set(false);
          resolve(0);
        },
      });
    });
  }
}
