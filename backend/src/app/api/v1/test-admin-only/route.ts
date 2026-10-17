import { config } from '@config/zamaro';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Test environments only: a route for admins alone, so the suite can prove the role gate answers a
// stranger with the same 404 as an unknown address (L2-074.1). Everywhere else this address does
// not exist.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: () => {
      if (config().env !== 'test') {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      return Response.json({ secret: 'for admins only' });
    },
  },
  { name: 'test.admin-only', roles: [Role.Administrator] },
);
