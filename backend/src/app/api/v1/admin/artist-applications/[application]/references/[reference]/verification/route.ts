import { describeApplication } from '@/server/actions/administration/view-artist-application';
import { setReferenceVerification } from '@/server/actions/artist-onboarding/set-reference-verification';
import { routes } from '@/server/http/pipeline';
import { SetReferenceVerificationRequest } from '@/server/http/requests/administration/reference-verification';
import { toAdminReference } from '@/server/http/resources/administration/artist-application';
import { validateBody } from '@/server/http/validation';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function idOf(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  return id;
}

// Tick or untick a reference (L2-048.1): saved at once with who and when, and audited (L2-069.1).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    PUT: async (request, context) => {
      const params = await context.params;
      const applicationId = idOf(params.application);
      const { verified } = await validateBody(request, SetReferenceVerificationRequest);
      const referenceId = await setReferenceVerification(
        applicationId,
        idOf(params.reference),
        verified,
        requireUser(),
        request,
      );
      const review = await describeApplication(applicationId);
      const reference = review.references.find(({ row }) => row.id === referenceId);
      if (reference === undefined) throw new Error('The reference could not be read back.');
      return Response.json({ data: toAdminReference(reference) });
    },
  },
  { name: 'admin.artist-applications.references.verify', admin: true, cache: 'private' },
);
