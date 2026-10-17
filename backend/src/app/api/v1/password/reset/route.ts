import { resetPassword } from '@/server/actions/accounts/reset-password';
import { routes } from '@/server/http/pipeline';
import { ResetPasswordRequest } from '@/server/http/requests/accounts/password-reset';
import { toCurrentUserResource } from '@/server/http/resources/accounts/current-user';
import { validateBody } from '@/server/http/validation';
import { termsAcceptanceRequired } from '@/server/services/privacy/legal-document-registry';
import { passwordPolicyError } from '@/server/support/password-policy';
import { ValidationProblem } from '@/server/support/problems';
import { requireSession } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Choose a new password. Uses the link once: the password changes, every session of the account
// ends, its owner is emailed, and this browser is signed in with a new session (L2-023.4). With
// two-step sign-in on, the code step signs this browser in (202).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const session = requireSession();
      const input = await validateBody(request, ResetPasswordRequest);
      const passwordError = await passwordPolicyError(input.password);
      if (passwordError !== undefined) throw new ValidationProblem({ password: [passwordError] });
      const outcome = await resetPassword(input.token, input.password, session, request);
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
  },
  { name: 'password.reset', rateLimit: 'password-reset', cache: 'private' },
);
