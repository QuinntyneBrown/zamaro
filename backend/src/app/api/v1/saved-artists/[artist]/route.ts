import { saveArtist, unsaveArtist } from '@/server/actions/accounts/save-artist';
import { Role } from '@/server/enums';
import { routes, type RouteContext } from '@/server/http/pipeline';
import { toSavedArtistStateResource } from '@/server/http/resources/accounts/saved-artist';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PUT saves an artist (saving twice is the same as once; 404 for one not approved and published;
// 422 saved-artist-limit at 200). DELETE removes a saved artist; removing one that was not saved
// changes nothing. Both answer the server's count (L2-026). Bookers only.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    PUT: async (_request, context) => {
      const state = await saveArtist(requireUser().id, await artistIdOf(context));
      return Response.json(toSavedArtistStateResource(state));
    },
    DELETE: async (_request, context) => {
      const state = await unsaveArtist(requireUser().id, await artistIdOf(context));
      return Response.json(toSavedArtistStateResource(state));
    },
  },
  {
    name: 'saved-artists.save',
    names: { DELETE: 'saved-artists.unsave' },
    roles: [Role.Booker],
    cache: 'private',
  },
);

async function artistIdOf(context: RouteContext): Promise<number> {
  const { artist } = await context.params;
  const id = Number(artist);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  return id;
}
