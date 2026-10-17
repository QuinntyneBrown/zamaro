import { confirmTwoFactor } from '@/server/actions/accounts/enable-two-factor';
import { routes } from '@/server/http/pipeline';
import { TwoFactorCodeRequest } from '@/server/http/requests/accounts/two-factor';
import { validateBody } from '@/server/http/validation';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Confirm two-step sign-in with the first code from the app: it turns on, and the 10 recovery codes
// are answered once (L2-072.3).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const user = requireUser();
      const { code } = await validateBody(request, TwoFactorCodeRequest);
      const recoveryCodes = await confirmTwoFactor(user, code);
      return Response.json({ data: { recoveryCodes } });
    },
  },
  { name: 'account.two-factor.confirm', cache: 'private' },
);
