import { type Observable, of } from 'rxjs';
import type { PublicReview, ReviewPage } from '../models/reviews';
import type { ReviewsApi } from '../services/reviews';

/**
 * In-memory ReviewsApi for scenarios and component tests: pages through the reviews it is given,
 * newest first, where the cursor is the index to continue from.
 */
export class InMemoryReviewsApi implements ReviewsApi {
  constructor(
    private readonly reviews: Readonly<Record<string, readonly PublicReview[]>> = {},
    private readonly perPage = 10,
  ) {}

  list(slug: string, cursor: string): Observable<ReviewPage> {
    const all = this.reviews[slug] ?? [];
    const start = Number(cursor);
    const end = start + this.perPage;
    return of({
      reviews: all.slice(start, end),
      nextCursor: end < all.length ? String(end) : null,
    });
  }
}
