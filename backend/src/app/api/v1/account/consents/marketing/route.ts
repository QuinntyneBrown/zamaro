import { marketingChoice, saveMarketingChoice } from '@/server/actions/privacy/marketing-choice';
import { clientAddress } from '@/server/http/client-address';
import { routes } from '@/server/http/pipeline';
import { MarketingChoiceRequest } from '@/server/http/requests/privacy/consents';
import { validateBody } from '@/server/http/validation';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The marketing choice (L2-080.4): GET reads the latest record; POST appends a record with source
// `settings`, keeping the earlier ones.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      return Response.json({ data: { granted: await marketingChoice(requireUser().id) } });
    },
    POST: async (request) => {
      const { id } = requireUser();
      const { granted } = await validateBody(request, MarketingChoiceRequest);
      await saveMarketingChoice(id, granted, {
        ipAddress: clientAddress(request),
        userAgent: request.headers.get('user-agent'),
      });
      return Response.json({ data: { granted } });
    },
  },
  {
    name: 'account.consents.marketing.show',
    names: { POST: 'account.consents.marketing.save' },
    cache: 'private',
  },
);
