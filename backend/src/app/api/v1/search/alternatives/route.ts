import { findSearchAlternatives } from '@/server/actions/discovery/find-search-alternatives';
import { routes } from '@/server/http/pipeline';
import { validateSearch } from '@/server/http/requests/discovery/search-artists';
import type { AlternativesResource } from '@/server/http/resources/discovery/alternatives';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ways forward when a search finds nobody (L2-011): nearby dates with their counts, a wider radius
// and whether filters apply. Takes the search's own parameters; the cursor is ignored.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request) => {
      const { criteria } = await validateSearch(request);
      const body: AlternativesResource = { data: await findSearchAlternatives(criteria) };
      return Response.json(body);
    },
  },
  { name: 'search.alternatives', rateLimit: 'search' },
);
