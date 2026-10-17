import { churchOf, saveChurch } from '@/server/actions/accounts/save-church';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { SaveChurchRequest } from '@/server/http/requests/accounts/settings';
import { toChurchResource } from '@/server/http/resources/accounts/church';
import { validateBody } from '@/server/http/validation';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A booker's church (accounts/manage-church-profile); bookers only. GET answers `data: null` until
// they save one. PUT creates or replaces the one church: the address is looked up and must be within
// 200 km of Toronto by road (L2-001), or nothing is stored. Bookings already sent keep the address
// they were made with (L2-024.3).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const church = await churchOf(requireUser().id);
      return Response.json({ data: church === null ? null : toChurchResource(church) });
    },
    PUT: async (request) => {
      const { id } = requireUser();
      const input = await validateBody(request, SaveChurchRequest);
      return Response.json({ data: toChurchResource(await saveChurch(id, input)) });
    },
  },
  {
    name: 'account.church.show',
    names: { PUT: 'account.church.update' },
    roles: [Role.Booker],
    cache: 'private',
  },
);
