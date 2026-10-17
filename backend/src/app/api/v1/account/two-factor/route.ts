import { beginTwoFactor } from '@/server/actions/accounts/enable-two-factor';
import { turnOffTwoFactor } from '@/server/actions/accounts/manage-two-factor';
import { routes } from '@/server/http/pipeline';
import { TwoFactorProofRequest } from '@/server/http/requests/accounts/two-factor';
import { validateBody } from '@/server/http/validation';
import { groupedSecret, otpauthUri } from '@/server/services/accounts/totp';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST begins two-step sign-in: a new key for an authenticator app; nothing changes until a code
// confirms it, and a second call replaces the key (409 when already on). DELETE turns it off with a
// current code or an unused recovery code; the key and every recovery code go and the owner is
// emailed (L2-072.5); 404 when it is not on, 409 for an administrator (L2-066.2).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async () => {
      const user = requireUser();
      const secret = await beginTwoFactor(user);
      return Response.json({
        data: { key: groupedSecret(secret), otpauthUri: otpauthUri(user.row.email, secret) },
      });
    },
    DELETE: async (request) => {
      const user = requireUser();
      if (!user.row.mfaEnabled) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      const { code } = await validateBody(request, TwoFactorProofRequest);
      await turnOffTwoFactor(user, code);
      return new Response(null, { status: 204 });
    },
  },
  {
    name: 'account.two-factor.begin',
    names: { DELETE: 'account.two-factor.destroy' },
    cache: 'private',
  },
);
