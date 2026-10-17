import { showArtistProfile } from '@/server/actions/artist-profiles/show-artist-profile';
import {
  reviewPage,
  reviewTotal,
  REVIEWS_ON_PROFILE,
} from '@/server/actions/reviews/list-artist-reviews';
import { cachedJson } from '@/server/http/caching';
import { routes } from '@/server/http/pipeline';
import { slugParam, underArtistSlug } from '@/server/http/requests/artist-profiles/resolve';
import {
  carriedSearch,
  ShowArtistProfileRequest,
} from '@/server/http/requests/artist-profiles/show-artist-profile';
import { toArtistProfileResource } from '@/server/http/resources/artist-profiles/profile';
import { toLineupCardResource } from '@/server/http/resources/discovery/lineup';
import { validateQuery } from '@/server/http/validation';
import { ArtistNotFound } from '@/server/services/artist-profiles/resolve-artist-slug';
import { similarArtists } from '@/server/services/discovery/similar-artist-finder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// An artist's public profile, for guests and bookers alike. A retired slug answers 301 to the
// current one; a missing or hidden artist is a 404 problem with up to 3 similar artists free on
// the carried search date (L2-021). Public and shared: the CDN may reuse it for 60 seconds, and
// If-None-Match answers 304 (L2-089.1).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, { params }) => {
      const slug = slugParam(await params);
      const search = validateQuery(request, ShowArtistProfileRequest);
      const profile = await underArtistSlug(request, slug, async () => {
        try {
          return await showArtistProfile(slug);
        } catch (error) {
          if (!(error instanceof ArtistNotFound)) throw error;
          const similar = await similarArtists(error.primaryStyle, carriedSearch(search));
          throw error.withSimilarArtists({
            date: similar.date.toISODate(),
            radiusKm: similar.radiusKm,
            items: similar.cards.map(toLineupCardResource),
          });
        }
      });
      const [page, total] = await Promise.all([
        reviewPage(profile.artist.id, REVIEWS_ON_PROFILE),
        reviewTotal(profile.artist.id),
      ]);
      return cachedJson(request, toArtistProfileResource(profile, { page, total }));
    },
  },
  { name: 'artists.show' },
);
