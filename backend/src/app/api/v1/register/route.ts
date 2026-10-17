import { registerBooker } from '@/server/actions/accounts/register-booker';
import { assertBotChallengePassed } from '@/server/http/bot-challenge';
import { clientAddress } from '@/server/http/client-address';
import { routes } from '@/server/http/pipeline';
import { RegisterBookerRequest } from '@/server/http/requests/accounts/register-booker';
import { jsonBody, validate } from '@/server/http/validation';
import { passwordPolicyError } from '@/server/support/password-policy';
import { ValidationProblem } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Register as a booker. Every valid submission gets the same 202, whether or not the address already
// has an account (L2-022.2): a new account is sent a verification link; an existing owner is told by
// email. The person is not signed in. The bot challenge runs before validation (L2-077.4), and the
// 11th registration in an hour from one address is refused (L2-077.3).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const body = await jsonBody(request);
      await assertBotChallengePassed(body, request, 'register');
      const input = validate(body, RegisterBookerRequest);
      const passwordError = await passwordPolicyError(input.password);
      if (passwordError !== undefined) throw new ValidationProblem({ password: [passwordError] });
      const email = await registerBooker(input, {
        ipAddress: clientAddress(request),
        userAgent: request.headers.get('user-agent'),
      });
      return Response.json({ data: { email } }, { status: 202 });
    },
  },
  { name: 'register', rateLimit: 'register', cache: 'private' },
);
