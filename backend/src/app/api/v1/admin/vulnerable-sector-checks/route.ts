import { listChecksWaiting } from '@/server/actions/administration/list-vsc-queue';
import { routes } from '@/server/http/pipeline';
import { toAdminCheckResource } from '@/server/http/resources/administration/vulnerable-sector-check';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The administrator's Vulnerable Sector Check queue (L2-049.2): the checks waiting for verification,
// oldest upload first, with the artist, the issue date and the verified check each one replaces.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const waiting = await listChecksWaiting();
      return Response.json({
        data: waiting.map(toAdminCheckResource),
        meta: { waiting: waiting.length },
      });
    },
  },
  { name: 'admin.vulnerable-sector-checks.index', admin: true, cache: 'private' },
);
