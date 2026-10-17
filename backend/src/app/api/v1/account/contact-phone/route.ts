import { contactPhoneOf, updateContactPhone } from '@/server/actions/accounts/account-settings';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { UpdateContactPhoneRequest } from '@/server/http/requests/accounts/settings';
import { validateBody } from '@/server/http/validation';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// An artist's private contact phone (L2-025.4): churches see it only once a booking is confirmed,
// and it is never on the public profile. Artists only; anyone else gets the same 404 as an unknown
// address (L2-074.1).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      return Response.json({ data: { contactPhone: await contactPhoneOf(requireUser().id) } });
    },
    PUT: async (request) => {
      const { id } = requireUser();
      const { contactPhone } = await validateBody(request, UpdateContactPhoneRequest);
      return Response.json({ data: { contactPhone: await updateContactPhone(id, contactPhone) } });
    },
  },
  {
    name: 'account.contact-phone.show',
    names: { PUT: 'account.contact-phone.update' },
    roles: [Role.Artist],
    cache: 'private',
  },
);
