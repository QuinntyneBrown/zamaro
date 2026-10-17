import {
  decodeReviewCursor,
  encodeReviewCursor,
  listArtistReviews,
  REVIEWS_PER_PAGE,
} from '@/server/actions/reviews/list-artist-reviews';
import { routes } from '@/server/http/pipeline';
import { slugParam, underArtistSlug } from '@/server/http/requests/artist-profiles/resolve';
import { ListArtistReviewsRequest } from '@/server/http/requests/reviews/list-artist-reviews';
import { toReviewResource, type ReviewPageResource } from '@/server/http/resources/reviews/review';
import { validateQuery } from '@/server/http/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// An artist's visible reviews, newest first, 10 at a time (L2-018). The profile already carries the
// first 4 and the cursor to continue from.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, { params }) => {
      const slug = slugParam(await params);
      const { cursor } = validateQuery(request, ListArtistReviewsRequest);
      const page = await underArtistSlug(request, slug, () =>
        listArtistReviews(slug, cursor === undefined ? null : decodeReviewCursor(cursor)),
      );
      const body: ReviewPageResource = {
        data: page.items.map(toReviewResource),
        meta: {
          perPage: REVIEWS_PER_PAGE,
          nextCursor: page.nextCursor === null ? null : encodeReviewCursor(page.nextCursor),
        },
      };
      return Response.json(body);
    },
  },
  { name: 'artists.reviews' },
);
