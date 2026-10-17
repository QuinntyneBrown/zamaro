import { renameAccount } from '@/server/actions/accounts/account-settings';
import { routes } from '@/server/http/pipeline';
import { UpdateProfileRequest } from '@/server/http/requests/accounts/settings';
import { toCurrentUserResource } from '@/server/http/resources/accounts/current-user';
import { validateBody } from '@/server/http/validation';
import { termsAcceptanceRequired } from '@/server/services/privacy/legal-document-registry';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Change the account name; the header's initials follow it (L2-024.2). Answers the signed-in person.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    PUT: async (request) => {
      const { id } = requireUser();
      const { name } = await validateBody(request, UpdateProfileRequest);
      const user = await renameAccount(id, name);
      return Response.json(toCurrentUserResource(user, await termsAcceptanceRequired(user.id)));
    },
  },
  { name: 'account.profile.update', cache: 'private' },
);
