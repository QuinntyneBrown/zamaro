import { describeApplication } from '@/server/actions/administration/view-artist-application';
import { approveArtistApplication } from '@/server/actions/artist-onboarding/approve-artist-application';
import { routes } from '@/server/http/pipeline';
import { toAdminApplication } from '@/server/http/resources/administration/artist-application';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Approve an application (L2-048.1): both references must be verified (422 otherwise), the applicant
// gains the Artist role and an unpublished artist is created. A second approval is a 409.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request, context) => {
      const { application } = await context.params;
      const id = Number(application);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      await approveArtistApplication(id, requireUser(), request);
      return Response.json({ data: toAdminApplication(await describeApplication(id)) });
    },
  },
  { name: 'admin.artist-applications.approve', admin: true, cache: 'private' },
);
