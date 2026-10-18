import { describeApplication } from '@/server/actions/administration/view-artist-application';
import { rejectArtistApplication } from '@/server/actions/artist-onboarding/reject-artist-application';
import { routes } from '@/server/http/pipeline';
import { RejectArtistApplicationRequest } from '@/server/http/requests/administration/application-rejection';
import { toAdminApplication } from '@/server/http/resources/administration/artist-application';
import { validateBody } from '@/server/http/validation';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Reject an application (L2-048.2): a reason from the fixed list and an optional note, both emailed
// to the applicant. A decided application answers 409.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request, context) => {
      const { application } = await context.params;
      const id = Number(application);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      const decision = await validateBody(request, RejectArtistApplicationRequest);
      await rejectArtistApplication(id, decision, requireUser(), request);
      return Response.json({ data: toAdminApplication(await describeApplication(id)) });
    },
  },
  { name: 'admin.artist-applications.reject', admin: true, cache: 'private' },
);
