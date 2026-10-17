import { checkResetLink } from '@/server/actions/accounts/reset-password';
import { routes } from '@/server/http/pipeline';
import { CheckPasswordResetRequest } from '@/server/http/requests/accounts/password-reset';
import { validateBody } from '@/server/http/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Check a reset link: says whether it still works, without using it. A link that was used, is over
// 60 minutes old or is unknown is the 410 problem; one that existed names its account and when it
// was sent.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const { token } = await validateBody(request, CheckPasswordResetRequest);
      const link = await checkResetLink(token);
      return Response.json({ data: { email: link.email, expiresAt: link.expiresAt.toISO() } });
    },
  },
  { name: 'password.reset.check', rateLimit: 'password-reset', cache: 'private' },
);
