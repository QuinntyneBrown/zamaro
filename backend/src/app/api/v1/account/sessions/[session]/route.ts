import { routes } from '@/server/http/pipeline';
import { endSession } from '@/server/services/accounts/session-registry';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// End a session: signs that device out at once, so its next request gets 401. A session that is not
// the caller's gets the same 404 as one that does not exist (L2-074.2).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    DELETE: async (_request, context) => {
      const { session } = await context.params;
      const ended = await endSession(requireUser().id, typeof session === 'string' ? session : '');
      if (!ended) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      return new Response(null, { status: 204 });
    },
  },
  { name: 'account.sessions.destroy', cache: 'private' },
);
