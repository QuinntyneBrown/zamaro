import { routes } from '@/server/http/pipeline';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Any /api/v1 address no route file claims: a 404 problem carrying the request ID (L2-095.2), and
// CORS preflights answered so a browser can read it.
const notFound = (): never => {
  throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
};

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  { GET: notFound, POST: notFound, PUT: notFound, PATCH: notFound, DELETE: notFound },
  { name: 'not-found' },
);
