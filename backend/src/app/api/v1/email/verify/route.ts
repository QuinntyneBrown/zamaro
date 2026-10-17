import { verifyEmail } from '@/server/actions/accounts/verify-email';
import { routes } from '@/server/http/pipeline';
import { VerifyEmailRequest } from '@/server/http/requests/accounts/email-verification';
import { validateBody } from '@/server/http/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verify an email address: the emailed link's token marks the address verified, once, within 24
// hours (L2-022.3). The person is not signed in. A used, old or unknown link is the 410 problem.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const { token } = await validateBody(request, VerifyEmailRequest);
      const { name } = await verifyEmail(token);
      return Response.json({ data: { name } });
    },
  },
  { name: 'email.verify', cache: 'private' },
);
