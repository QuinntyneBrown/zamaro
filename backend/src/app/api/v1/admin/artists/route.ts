import { z } from 'zod';
import { listAdminArtists } from '@/server/actions/administration/list-admin-artists';
import { routes } from '@/server/http/pipeline';
import { toAdminArtistResource } from '@/server/http/resources/administration/artist';
import { optionalQuery, validateQuery } from '@/server/http/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The Artists list's search (pages/admin-artists): part of a name, base city or account email. */
export const ListAdminArtistsRequest = z.object({ q: optionalQuery(z.string().max(100)) });

// Every approved and suspended artist, A to Z; `q` narrows to a word start in the name, base city
// or account email. The counts cover every artist, not the match (L2-067, M3 D18).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request) => {
      const { q } = validateQuery(request, ListAdminArtistsRequest);
      const { artists, counts } = await listAdminArtists(q);
      return Response.json({ data: artists.map(toAdminArtistResource), meta: counts });
    },
  },
  { name: 'admin.artists.index', admin: true, cache: 'private' },
);
