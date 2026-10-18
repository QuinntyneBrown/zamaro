import { viewArtistApplication } from '@/server/actions/administration/view-artist-application';
import { routes } from '@/server/http/pipeline';
import { toAdminApplication } from '@/server/http/resources/administration/artist-application';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The review screen's data (L2-067.1): every applicant detail, the references with their contacts
// decrypted and the videos. Opening it is audited as `application.viewed` (L2-069.1).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, context) => {
      const { application } = await context.params;
      const id = Number(application);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      const review = await viewArtistApplication(id, requireUser(), request);
      return Response.json({ data: toAdminApplication(review) });
    },
  },
  { name: 'admin.artist-applications.show', admin: true, cache: 'private' },
);
