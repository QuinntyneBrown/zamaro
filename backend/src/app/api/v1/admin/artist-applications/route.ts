import { listApplicationsWaiting } from '@/server/actions/administration/list-artist-applications';
import { routes } from '@/server/http/pipeline';
import { toAdminApplicationRow } from '@/server/http/resources/administration/artist-application';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The administrator's application queue (L2-048, L2-067.1): the Submitted applications, oldest first.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const waiting = await listApplicationsWaiting();
      return Response.json({
        data: waiting.map(toAdminApplicationRow),
        meta: { waiting: waiting.length },
      });
    },
  },
  { name: 'admin.artist-applications.index', admin: true, cache: 'private' },
);
