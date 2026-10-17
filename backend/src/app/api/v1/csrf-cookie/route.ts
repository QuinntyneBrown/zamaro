import { routes } from '@/server/http/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Starts a guest session for Zamaro Web and writes the XSRF-TOKEN cookie the app repeats in
// X-XSRF-TOKEN on every state-changing request (L2-073.2, ADR-0018, ADR-0027). The pipeline sets
// the cookies on the answer.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  { GET: () => new Response(null, { status: 204 }) },
  { name: 'csrf-cookie', cache: 'private' },
);
