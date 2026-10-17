import { describeCheck } from '@/server/actions/administration/list-vsc-queue';
import { verifyVulnerableSectorCheck } from '@/server/actions/artist-onboarding/verify-vulnerable-sector-check';
import { routes } from '@/server/http/pipeline';
import { toAdminCheckResource } from '@/server/http/resources/administration/vulnerable-sector-check';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verify a check: it counts for Youth event searches for 3 years from its issue date (L2-049.2) and
// the decision is audited (L2-069.1). A check issued more than 3 years ago is refused on `issuedOn`;
// one no longer waiting is the 409 vsc-already-decided problem.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request, context) => {
      const { check } = await context.params;
      const id = Number(check);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      const verified = await verifyVulnerableSectorCheck(id, requireUser(), request);
      return Response.json({ data: toAdminCheckResource(await describeCheck(verified)) });
    },
  },
  { name: 'admin.vulnerable-sector-checks.verify', admin: true, cache: 'private' },
);
