import { DateTime } from 'luxon';
import { listSavedArtists } from '@/server/actions/accounts/list-saved-artists';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { ListSavedArtistsRequest } from '@/server/http/requests/accounts/saved-artists';
import { toSavedArtistListResource } from '@/server/http/resources/accounts/saved-artist';
import { validateQuery } from '@/server/http/validation';
import { ZONE } from '@/server/support/clock';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// List saved artists (L2-027): newest save first, each free or booked on `date` when one is given.
// Artists who are no longer visible are left out and not counted. Bookers only.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request) => {
      const { date } = validateQuery(request, ListSavedArtistsRequest);
      const list = await listSavedArtists(
        requireUser().id,
        date === undefined ? null : DateTime.fromISO(date, { zone: ZONE }).startOf('day'),
      );
      return Response.json(toSavedArtistListResource(list));
    },
  },
  { name: 'saved-artists.index', roles: [Role.Booker], cache: 'private' },
);
