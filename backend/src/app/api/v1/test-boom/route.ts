import { config } from '@config/zamaro';
import { routes } from '@/server/http/pipeline';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Test environments only: an unhandled error, so the suite can prove a 500 carries no internals
// (L2-078.3, L2-095.2). Everywhere else this address does not exist.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: () => {
      if (config().env !== 'test') {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      throw new Error('database password is hunter2');
    },
  },
  { name: 'test.boom' },
);
