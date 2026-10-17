import { config } from '@config/zamaro';
import { sendPasswordResetLink } from '@/server/actions/accounts/send-password-reset-link';
import { assertBotChallengePassed } from '@/server/http/bot-challenge';
import { routes } from '@/server/http/pipeline';
import { enforceKeyedLimit } from '@/server/http/rate-limits';
import { ForgotPasswordRequest } from '@/server/http/requests/accounts/password-reset';
import { jsonBody, validate } from '@/server/http/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ask for a reset link. Every valid request gets the same 202, whether or not the address has an
// account (L2-023.3); an account is emailed a link that works once, for 60 minutes, and earlier
// links stop working. The bot challenge runs first (L2-077.4); 5 links an hour per address and per
// email (M2 D6).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const body = await jsonBody(request);
      await assertBotChallengePassed(body, request, 'forgot-password');
      const input = validate(body, ForgotPasswordRequest);
      await enforceKeyedLimit(
        `forgot-password-email:${input.email.toLowerCase()}`,
        config().rateLimits.forgotPasswordPerHour,
        3600,
      );
      const email = await sendPasswordResetLink(input.email);
      return Response.json({ data: { email } }, { status: 202 });
    },
  },
  { name: 'password.forgot', rateLimit: 'forgot-password', cache: 'private' },
);
