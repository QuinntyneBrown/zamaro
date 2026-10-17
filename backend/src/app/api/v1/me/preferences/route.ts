import { updateThemePreference } from '@/server/actions/user-experience/update-preferences';
import { routes } from '@/server/http/pipeline';
import { UpdatePreferencesRequest } from '@/server/http/requests/user-experience/preferences';
import { toCurrentUserResource } from '@/server/http/resources/accounts/current-user';
import { validateBody } from '@/server/http/validation';
import { termsAcceptanceRequired } from '@/server/services/privacy/legal-document-registry';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Save preferences: the theme chosen with the toggle, so every device the person signs in on follows
// it (L2-104.2). Answers the signed-in person. Open while new terms wait, like /me.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    PATCH: async (request) => {
      const { id } = requireUser();
      const input = await validateBody(request, UpdatePreferencesRequest);
      const user = await updateThemePreference(id, input.themePreference ?? null);
      return Response.json(toCurrentUserResource(user, await termsAcceptanceRequired(user.id)));
    },
  },
  { name: 'me.preferences', cache: 'private' },
);
