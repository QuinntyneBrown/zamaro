import { assertCurrentPassword } from '@/server/actions/accounts/current-password';
import { requestEmailChange } from '@/server/actions/accounts/request-email-change';
import { routes } from '@/server/http/pipeline';
import { ChangeEmailRequest } from '@/server/http/requests/accounts/account-security';
import { validateBody } from '@/server/http/validation';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ask for a new email, confirmed with the current password (L2-025.1). The new address gets a link
// that works once, for 24 hours, and the current one a notice; the account email stays until the
// link is opened. An address another account uses gets the same answer and no link.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    PUT: async (request) => {
      const user = requireUser();
      const input = await validateBody(request, ChangeEmailRequest);
      await assertCurrentPassword(user, input.currentPassword);
      const email = await requestEmailChange(user, input.email);
      return Response.json({ data: { email } }, { status: 202 });
    },
  },
  { name: 'account.email.update', cache: 'private' },
);
