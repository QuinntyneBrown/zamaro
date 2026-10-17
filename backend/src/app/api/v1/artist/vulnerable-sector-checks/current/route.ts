import { currentChecks } from '@/server/actions/artist-onboarding/upload-vulnerable-sector-check';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { toCheckResource } from '@/server/http/resources/artist-onboarding/vulnerable-sector-check';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Where the artist's checks stand: the most recent verified check, which Youth event searches
// count, and the newest check of any status. Either is null when there is none. Artists only.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const { verified, latest } = await currentChecks(requireUser().id);
      return Response.json({
        data: {
          verified: verified === null ? null : toCheckResource(verified),
          latest: latest === null ? null : toCheckResource(latest),
        },
      });
    },
  },
  { name: 'artist.vulnerable-sector-checks.current', roles: [Role.Artist], cache: 'private' },
);
