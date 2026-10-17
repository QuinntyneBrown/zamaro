import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { vulnerableSectorChecks } from '@/server/db/schema';
import { VscStatus } from '@/server/enums';
import { routes } from '@/server/http/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The admin overview: what is waiting for the Zamaro team (administration/secure-admin-access, M3
// D17). Only an administrator who signed in with a code gets it; everyone else gets 404, as on every
// admin route (L2-066.1). Calling it counts as activity, so "Stay signed in" uses it (L2-066.3).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const [row] = await db()
        .select({ total: sql<number>`count(*)::int` })
        .from(vulnerableSectorChecks)
        .where(eq(vulnerableSectorChecks.status, VscStatus.Pending));
      return Response.json({ data: { checksWaiting: row?.total ?? 0 } });
    },
  },
  { name: 'admin.overview', admin: true, cache: 'private' },
);
