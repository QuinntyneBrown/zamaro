import { searchAvailableArtists } from '@/server/actions/discovery/search-available-artists';
import { routes } from '@/server/http/pipeline';
import { validateSearch } from '@/server/http/requests/discovery/search-artists';
import { toLineupResource } from '@/server/http/resources/discovery/lineup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Artists free on the date who will drive to the event location: the headliner, then the tickets
// closest first (L2-002, L2-003, L2-005, L2-006, L2-010).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request) => {
      const { criteria, after } = await validateSearch(request);
      const lineup = await searchAvailableArtists(criteria, after);
      return Response.json(toLineupResource(lineup, criteria));
    },
  },
  { name: 'search', rateLimit: 'search' },
);
