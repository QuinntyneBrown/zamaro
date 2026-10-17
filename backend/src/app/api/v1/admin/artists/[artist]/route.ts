import { findAdminArtist } from '@/server/actions/administration/list-admin-artists';
import { routes } from '@/server/http/pipeline';
import { toAdminArtistDetailResource } from '@/server/http/resources/administration/artist';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// One artist: the account, the profile, the upcoming bookings and the standing (read only until M8).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (_request, context) => {
      const { artist } = await context.params;
      const id = Number(artist);
      const detail = Number.isInteger(id) && id > 0 ? await findAdminArtist(id) : null;
      if (detail === null) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      return Response.json({ data: toAdminArtistDetailResource(detail) });
    },
  },
  { name: 'admin.artists.show', admin: true, cache: 'private' },
);
