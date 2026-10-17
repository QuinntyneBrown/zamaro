import { confirmEmailChange } from '@/server/actions/accounts/confirm-email-change';
import { routes } from '@/server/http/pipeline';
import { ConfirmEmailChangeRequest } from '@/server/http/requests/accounts/account-security';
import { validateBody } from '@/server/http/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Open an email change link: the account moves to the new address, verified. Anyone holding the link
// may open it; it signs no one in. A used, old, unknown or overtaken link is the 410 problem, which
// names the address the account still signs in with when the link existed.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const { token } = await validateBody(request, ConfirmEmailChangeRequest);
      const email = await confirmEmailChange(token);
      return Response.json({ data: { email } });
    },
  },
  { name: 'account.email.confirm', cache: 'private' },
);
