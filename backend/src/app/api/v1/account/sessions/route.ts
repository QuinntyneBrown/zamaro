import { routes } from '@/server/http/pipeline';
import { toSessionResource } from '@/server/http/resources/accounts/session';
import { activeSessions } from '@/server/services/accounts/session-registry';
import { requireSession, requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The signed-in devices (L2-025.3): every session still within its idle lifetime, this browser's
// first, then the most recently active.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const sessions = await activeSessions(requireUser().id, requireSession().id);
      return Response.json({ data: sessions.map(toSessionResource) });
    },
  },
  { name: 'account.sessions.index', cache: 'private' },
);
