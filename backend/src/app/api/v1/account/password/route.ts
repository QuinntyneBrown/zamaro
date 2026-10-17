import { changePassword } from '@/server/actions/accounts/change-password';
import { assertCurrentPassword } from '@/server/actions/accounts/current-password';
import { routes } from '@/server/http/pipeline';
import { ChangePasswordRequest } from '@/server/http/requests/accounts/account-security';
import { validateBody } from '@/server/http/validation';
import { passwordPolicyError } from '@/server/support/password-policy';
import { ValidationProblem } from '@/server/support/problems';
import { requireSession, requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Change the password: needs the current password. Every other session ends, and this one continues
// with a new session ID and CSRF token (L2-025.2); the owner is emailed.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    PUT: async (request) => {
      const user = requireUser();
      const session = requireSession();
      const input = await validateBody(request, ChangePasswordRequest);
      await assertCurrentPassword(user, input.currentPassword);
      const passwordError = await passwordPolicyError(input.password);
      if (passwordError !== undefined) throw new ValidationProblem({ password: [passwordError] });
      await changePassword(user, input.password, session, request);
      return new Response(null, { status: 204 });
    },
  },
  { name: 'account.password.update', cache: 'private' },
);
