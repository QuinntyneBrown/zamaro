import { setDateAvailability } from '@/server/actions/artist-availability/set-date-availability';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { SetDateAvailabilityRequest } from '@/server/http/requests/artist-availability/dates';
import { DateRangeResource } from '@/server/http/resources/artist-availability/dates';
import { validateBody } from '@/server/http/validation';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mark a range of dates unavailable or free (L2-056.3). Dates with open requests answer 409 with
// `affectedRequests` until the body says `confirm: true`, which declines those requests
// (L2-057.2); Confirmed dates are skipped (L2-057.1). Artists only.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    PUT: async (request) => {
      const range = await validateBody(request, SetDateAvailabilityRequest);
      const result = await setDateAvailability(requireUser().id, range);
      return Response.json(DateRangeResource.parse({ data: result }));
    },
  },
  { name: 'artist.availability.dates', roles: [Role.Artist], cache: 'private' },
);
