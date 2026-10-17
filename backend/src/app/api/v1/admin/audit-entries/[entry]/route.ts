import { findAuditEntry } from '@/server/actions/administration/list-audit-entries';
import { routes } from '@/server/http/pipeline';
import { toAuditEntryResource } from '@/server/http/resources/administration/audit-entry';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// One audit entry, the same row as the log lists. Entries can only be read: PATCH, PUT and DELETE on
// this address answer 405 (L2-069.2).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (_request, context) => {
      const { entry } = await context.params;
      const id = Number(entry);
      const view = Number.isInteger(id) && id > 0 ? await findAuditEntry(id) : null;
      if (view === null) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
      }
      return Response.json({ data: toAuditEntryResource(view) });
    },
  },
  { name: 'admin.audit-entries.show', admin: true, cache: 'private' },
);
