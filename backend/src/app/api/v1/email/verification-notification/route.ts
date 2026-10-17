import { resendVerificationEmail } from '@/server/actions/accounts/resend-verification-email';
import { routes } from '@/server/http/pipeline';
import { ResendVerificationEmailRequest } from '@/server/http/requests/accounts/email-verification';
import { validateBody } from '@/server/http/validation';
import { currentUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Send a new verification link: to the signed-in booker, else the owner of `token`, else `email`.
// Earlier links stop working. The answer is the same whether or not anything was sent (L2-022.2),
// and the 4th in 15 minutes is refused (M2 D6).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const input = await validateBody(request, ResendVerificationEmailRequest);
      await resendVerificationEmail({
        signedInUserId: currentUser()?.id,
        token: input.token,
        email: input.email,
        returnUrl: input.returnUrl,
      });
      return Response.json({ data: { accepted: true } }, { status: 202 });
    },
  },
  { name: 'email.resend-verification', rateLimit: 'resend-verification', cache: 'private' },
);
