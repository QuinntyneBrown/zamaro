import { pendingSecret } from '@/server/actions/accounts/enable-two-factor';
import { routes } from '@/server/http/pipeline';
import { otpauthUri, qrSvg } from '@/server/services/accounts/totp';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The QR code of the key begun: an SVG image for the setup page; 404 when no key is waiting.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const user = requireUser();
      const secret = pendingSecret(user);
      if (secret === null) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      return new Response(await qrSvg(otpauthUri(user.row.email, secret)), {
        headers: { 'Content-Type': 'image/svg+xml' },
      });
    },
  },
  { name: 'account.two-factor.qr', cache: 'private' },
);
