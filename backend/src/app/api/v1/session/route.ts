import { attemptSignIn, signOut } from '@/server/actions/accounts/sign-in';
import { routes } from '@/server/http/pipeline';
import { SignInRequest } from '@/server/http/requests/accounts/sign-in';
import { toCurrentUserResource } from '@/server/http/resources/accounts/current-user';
import { validateBody } from '@/server/http/validation';
import { termsAcceptanceRequired } from '@/server/services/privacy/legal-document-registry';
import { requireSession, requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST starts a session for Zamaro Web (L2-023.1): the answer sets a new zamaro_session cookie, and
// a wrong password or unknown email gets 422 with errors.credentials (L2-023.2); an account with
// two-step sign-in on gets 202 and the code step (L2-072.3). DELETE ends the session on the server
// (L2-023.5). Both are private, never cached (L2-089.3).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const session = requireSession();
      const input = await validateBody(request, SignInRequest);
      const outcome = await attemptSignIn(input, session, request);
      if (outcome.kind === 'two-factor') {
        return Response.json(
          { data: { twoFactorRequired: true, email: outcome.email } },
          { status: 202 },
        );
      }
      return Response.json(
        toCurrentUserResource(outcome.user, await termsAcceptanceRequired(outcome.user.id)),
      );
    },
    DELETE: async () => {
      requireUser();
      await signOut(requireSession());
      return new Response(null, { status: 204 });
    },
  },
  { name: 'session.store', cache: 'private' },
);
