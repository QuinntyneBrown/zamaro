import {
  buildArtistCalendar,
  calendarWindow,
  currentMonth,
} from '@/server/actions/artist-availability/build-artist-calendar';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { ArtistCalendarRequest } from '@/server/http/requests/artist-availability/calendar';
import { toCalendarResource } from '@/server/http/resources/artist-availability/calendar';
import { validateQuery } from '@/server/http/validation';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// One month of the artist's own calendar: each day Free, Unavailable, Requested (with a count) or
// Booked, derived on read, with the window the pager runs across (L2-056.1, L2-057.1). Artists only.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request) => {
      const { month } = validateQuery(request, ArtistCalendarRequest);
      const calendar = await buildArtistCalendar(requireUser().id, month ?? currentMonth());
      return Response.json(toCalendarResource(calendar, calendarWindow()));
    },
  },
  { name: 'artist.calendar', roles: [Role.Artist], cache: 'private' },
);
