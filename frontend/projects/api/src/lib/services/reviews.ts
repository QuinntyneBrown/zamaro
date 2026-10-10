import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { PublicReview, ReviewPage } from '../models/reviews';

/** An artist's public reviews. Pages depend on the token, never the implementation. */
export interface ReviewsApi {
  /** The 10 reviews after `cursor`, newest first. */
  list(slug: string, cursor: string): Observable<ReviewPage>;
}

export const REVIEWS_API = new InjectionToken<ReviewsApi>('ReviewsApi');

@Injectable()
export class HttpReviewsApi implements ReviewsApi {
  private readonly http = inject(HttpClient);

  list(slug: string, cursor: string): Observable<ReviewPage> {
    return this.http
      .get<{
        data: PublicReview[];
        meta: { nextCursor: string | null };
      }>(`/api/v1/artists/${encodeURIComponent(slug)}/reviews`, { params: { cursor } })
      .pipe(map((response) => ({ reviews: response.data, nextCursor: response.meta.nextCursor })));
  }
}
