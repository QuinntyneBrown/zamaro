import { cachedJson } from '@/server/http/caching';
import { routes } from '@/server/http/pipeline';
import { CheckDateRequest } from '@/server/http/requests/artist-profiles/dates';
import { slugParam, underArtistSlug } from '@/server/http/requests/artist-profiles/resolve';
import type { AvailabilityResource } from '@/server/http/resources/artist-profiles/dates';
import { validateQuery } from '@/server/http/validation';
import { freeArtistIds } from '@/server/services/artist-availability/availability';
import { bookingDate } from '@/server/services/artist-availability/booking-window';
import { resolveArtistSlug } from '@/server/services/artist-profiles/resolve-artist-slug';
import { freeCancellationUntil } from '@/server/services/bookings/cancellation-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Whether the artist is free on one date, for the booking stub (L2-019), with the last day a
// booking on it could be cancelled for free (L2-044).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, { params }) => {
      const slug = slugParam(await params);
      const input = validateQuery(request, CheckDateRequest);
      const date = bookingDate(input.date);
      if (date === null) throw new Error('The date was validated.');
      const artist = await underArtistSlug(request, slug, () => resolveArtistSlug(slug));
      const free = (await freeArtistIds([artist.id], date)).length > 0;
      const body: AvailabilityResource = {
        data: {
          date: date.toISODate() ?? input.date,
          free,
          freeCancellationUntil: free ? (freeCancellationUntil(date).toISODate() ?? null) : null,
        },
      };
      return cachedJson(request, body);
    },
  },
  { name: 'artists.availability' },
);
