import { config } from '@config/zamaro';
import { cachedJson } from '@/server/http/caching';
import { routes } from '@/server/http/pipeline';
import type { FeaturesResource } from '@/server/http/resources/operations/features';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Which unfinished features this environment has turned on (ADR-0012). Every flag is off unless
// the environment's configuration turns it on.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: (request) => {
      const body: FeaturesResource = {
        data: { bookingRequests: config().features.bookingRequests },
      };
      return cachedJson(request, body);
    },
  },
  { name: 'features' },
);
