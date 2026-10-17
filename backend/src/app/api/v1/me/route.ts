import { routes } from '@/server/http/pipeline';
import { toCurrentUserResource } from '@/server/http/resources/accounts/current-user';
import { termsAcceptanceRequired } from '@/server/services/privacy/legal-document-registry';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The signed-in person (current-user names, ADR-0016); a guest gets the 401 problem. Private,
// never cached (L2-089.3).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const user = requireUser();
      return Response.json(toCurrentUserResource(user, await termsAcceptanceRequired(user.id)));
    },
  },
  { name: 'me.show', cache: 'private' },
);
