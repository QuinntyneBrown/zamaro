import { savedArtistIds } from '@/server/actions/accounts/save-artist';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The saved artists' ids, for the hearts on every ticket and the header's count. Bookers only.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const artistIds = await savedArtistIds(requireUser().id);
      return Response.json({ data: { artistIds, count: artistIds.length } });
    },
  },
  { name: 'saved-artists.ids', roles: [Role.Booker], cache: 'private' },
);
