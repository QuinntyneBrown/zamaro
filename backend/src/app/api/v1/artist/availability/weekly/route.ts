import { setWeeklyAvailability } from '@/server/actions/artist-availability/set-weekly-availability';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { SetWeeklyAvailabilityRequest } from '@/server/http/requests/artist-availability/weekly';
import { WeeklyAvailabilityResource } from '@/server/http/resources/artist-availability/weekly';
import { validateBody } from '@/server/http/validation';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Replace the weekly default: the weekdays the artist is unavailable unless a date says otherwise.
// Searches see it at once (L2-056.2, L2-056.3). Artists only.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    PUT: async (request) => {
      const { unavailableWeekdays } = await validateBody(request, SetWeeklyAvailabilityRequest);
      const saved = await setWeeklyAvailability(requireUser().id, unavailableWeekdays);
      return Response.json(
        WeeklyAvailabilityResource.parse({ data: { unavailableWeekdays: saved } }),
      );
    },
  },
  { name: 'artist.availability.weekly', roles: [Role.Artist], cache: 'private' },
);
