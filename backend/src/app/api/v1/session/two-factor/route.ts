import { completeTwoFactorChallenge } from '@/server/actions/accounts/two-factor-challenge';
import { routes } from '@/server/http/pipeline';
import { TwoFactorChallengeRequest } from '@/server/http/requests/accounts/two-factor';
import { toCurrentUserResource } from '@/server/http/resources/accounts/current-user';
import { validateBody } from '@/server/http/validation';
import { termsAcceptanceRequired } from '@/server/services/privacy/legal-document-registry';
import { requireSession } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Complete sign-in with a code: after the password step answered 202, a current code from the
// authenticator app, or an unused recovery code once, signs in with a new session (L2-072.3). Wrong
// codes count toward the 5-in-15-minutes pause (L2-072.4); no waiting password step is 401.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const session = requireSession();
      const answer = await validateBody(request, TwoFactorChallengeRequest);
      const user = await completeTwoFactorChallenge(answer, session, request);
      return Response.json(toCurrentUserResource(user, await termsAcceptanceRequired(user.id)));
    },
  },
  { name: 'session.two-factor', cache: 'private' },
);
