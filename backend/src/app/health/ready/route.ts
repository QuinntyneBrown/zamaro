import { routes } from '@/server/http/pipeline';
import { checkReadiness } from '@/server/services/operations/readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Readiness (L2-090.2, ADR-0005): 200 {"status":"ready"} or 503 {"status":"not ready","failed":[...]}.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const readiness = await checkReadiness();
      return Response.json(readiness, {
        status: readiness.status === 'ready' ? 200 : 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    },
  },
  { name: 'health.ready' },
);
