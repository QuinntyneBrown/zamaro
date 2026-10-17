import {
  AUDIT_PAGE_SIZE,
  decodeAuditCursor,
  listAuditEntries,
} from '@/server/actions/administration/list-audit-entries';
import { routes } from '@/server/http/pipeline';
import { ListAuditEntriesRequest } from '@/server/http/requests/administration/audit-entries';
import { toAuditEntryResource } from '@/server/http/resources/administration/audit-entry';
import { validateQuery } from '@/server/http/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The read-only audit log (administration/record-audit-log, L2-069): newest first, 50 at a time,
// narrowed by actor email, action, target, outcome and a date range. Administrators only (L2-066.1).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request) => {
      const { cursor, ...filters } = validateQuery(request, ListAuditEntriesRequest);
      const page = await listAuditEntries(
        filters,
        cursor === undefined ? null : decodeAuditCursor(cursor),
      );
      return Response.json({
        data: page.entries.map(toAuditEntryResource),
        meta: { perPage: AUDIT_PAGE_SIZE, nextCursor: page.nextCursor },
      });
    },
  },
  { name: 'admin.audit-entries.index', admin: true, cache: 'private' },
);
