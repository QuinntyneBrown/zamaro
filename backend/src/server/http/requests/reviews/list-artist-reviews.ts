import { z } from 'zod';
import { decodeReviewCursor } from '@/server/actions/reviews/list-artist-reviews';
import { optionalQuery } from '../../validation';

export const ListArtistReviewsRequest = z.object({
  /** `reviews.nextCursor` from the profile, or `meta.nextCursor` from the previous page. */
  cursor: optionalQuery(
    z
      .string()
      .refine(
        (value) => decodeReviewCursor(value) !== null,
        'These reviews have changed. Reload the page.',
      ),
  ),
});

export type ListArtistReviewsRequest = z.infer<typeof ListArtistReviewsRequest>;
