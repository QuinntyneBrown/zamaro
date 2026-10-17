import { newRecoveryCodes } from '@/server/actions/accounts/manage-two-factor';
import { routes } from '@/server/http/pipeline';
import { TwoFactorProofRequest } from '@/server/http/requests/accounts/two-factor';
import { validateBody } from '@/server/http/validation';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// New recovery codes: needs a current code or an unused recovery code; 10 new codes replace every
// earlier one and are answered once (L2-072.5). 404 when two-step sign-in is not on.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const user = requireUser();
      if (!user.row.mfaEnabled) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      const { code } = await validateBody(request, TwoFactorProofRequest);
      const recoveryCodes = await newRecoveryCodes(user, code);
      return Response.json({ data: { recoveryCodes } });
    },
  },
  { name: 'account.two-factor.recovery-codes', cache: 'private' },
);
