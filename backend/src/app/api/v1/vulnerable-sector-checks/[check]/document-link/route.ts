import { documentLinkFor } from '@/server/actions/artist-onboarding/document-link';
import { routes, type RouteContext } from '@/server/http/pipeline';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A signed link to a check's document (L2-049.4): the owner and administrators only; the policy
// conceals everything else as an unknown address (L2-074.2).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, context) => {
      const link = await documentLinkFor(await checkIdOf(context), requireUser(), request);
      return Response.json({ data: link });
    },
  },
  { name: 'vulnerable-sector-checks.document-link', cache: 'private' },
);

export async function checkIdOf(context: RouteContext): Promise<number> {
  const { check } = await context.params;
  const id = Number(check);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  return id;
}
