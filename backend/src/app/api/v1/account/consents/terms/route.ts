import { acceptCurrentTerms } from '@/server/actions/privacy/accept-current-terms';
import { clientAddress } from '@/server/http/client-address';
import { routes } from '@/server/http/pipeline';
import { AcceptTermsRequest } from '@/server/http/requests/privacy/consents';
import { toCurrentUserResource } from '@/server/http/resources/accounts/current-user';
import { validateBody } from '@/server/http/validation';
import { termsAcceptanceRequired } from '@/server/services/privacy/legal-document-registry';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Accept the current terms: records the version the page showed (409 when it is no longer current);
// the answer is the person, no longer stopped (L2-080.3). Open while the terms are unaccepted.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async (request) => {
      const user = requireUser();
      const { termsVersion } = await validateBody(request, AcceptTermsRequest);
      await acceptCurrentTerms(user.id, termsVersion, {
        ipAddress: clientAddress(request),
        userAgent: request.headers.get('user-agent'),
      });
      return Response.json(toCurrentUserResource(user, await termsAcceptanceRequired(user.id)));
    },
  },
  { name: 'account.consents.terms', cache: 'private' },
);
