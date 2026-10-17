import { routes } from '@/server/http/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Liveness (L2-090.2): the process answers. Outside /api/v1, no session, CSRF or rate limit.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  { GET: () => Response.json({ status: 'live' }, { headers: { 'Cache-Control': 'no-store' } }) },
  { name: 'health.live' },
);
