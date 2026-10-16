import { sql } from 'drizzle-orm';
import { index, jsonb, pgTable, varchar } from 'drizzle-orm/pg-core';
import { foreignId, id, timestamptz } from './columns';
import { auditOutcome } from './enums';

/**
 * The append-only audit log (administration/record-audit-log, ADR-0022). A trigger in the migration
 * refuses every UPDATE, and every DELETE except by the retention role. No foreign keys: an entry
 * outlives the account it names until retention removes it.
 */
export const auditEntries = pgTable(
  'audit_entries',
  {
    id: id(),
    actorId: foreignId(),
    actorRole: varchar({ length: 20 }),
    action: varchar({ length: 64 }).notNull(),
    targetType: varchar({ length: 255 }),
    targetId: foreignId(),
    occurredAt: timestamptz()
      .notNull()
      .default(sql`now()`),
    ipAddress: varchar({ length: 45 }),
    outcome: auditOutcome().notNull(),
    context: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [
    index().on(table.occurredAt),
    index().on(table.actorId, table.occurredAt),
    index().on(table.targetType, table.targetId),
    index().on(table.action),
  ],
);
