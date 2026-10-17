import { listTourDates } from '@/server/actions/artist-profiles/list-tour-dates';
import { cachedJson } from '@/server/http/caching';
import { routes } from '@/server/http/pipeline';
import { ListTourDatesRequest } from '@/server/http/requests/artist-profiles/dates';
import { slugParam, underArtistSlug } from '@/server/http/requests/artist-profiles/resolve';
import type { TourDatesResource } from '@/server/http/resources/artist-profiles/dates';
import { validateQuery } from '@/server/http/validation';
import { bookingDate } from '@/server/services/artist-availability/booking-window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The artist's next 6 free or booked dates, for the "On tour" list (L2-017).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, { params }) => {
      const slug = slugParam(await params);
      const { from } = validateQuery(request, ListTourDatesRequest);
      const dates = await underArtistSlug(request, slug, () =>
        listTourDates(slug, from === undefined ? null : bookingDate(from)),
      );
      const body: TourDatesResource = {
        data: dates.map((date) => ({
          date: date.date,
          status: date.status,
          kind: date.kind,
          city: date.city,
        })),
      };
      return cachedJson(request, body);
    },
  },
  { name: 'artists.tour-dates' },
);
