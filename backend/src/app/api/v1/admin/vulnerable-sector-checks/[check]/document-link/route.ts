import { documentLinkFor } from '@/server/actions/artist-onboarding/document-link';
import { routes } from '@/server/http/pipeline';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The admin application's copy of the document link: the same action, outside the terms gate, since
// administrators are the Zamaro team and the admin app has no page to accept terms on (L2-080.3).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, context) => {
      const { check } = await context.params;
      const id = Number(check);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      return Response.json({ data: await documentLinkFor(id, requireUser(), request) });
    },
  },
  { name: 'admin.vulnerable-sector-checks.document-link', admin: true, cache: 'private' },
);
