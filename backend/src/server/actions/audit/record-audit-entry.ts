import type { NextRequest } from 'next/server';
import { db, type Database, type Transaction } from '@/server/db/client';
import { auditEntries } from '@/server/db/schema';
import type { AuditAction, AuditOutcome } from '@/server/enums';
import { clientAddress } from '@/server/http/client-address';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { now } from '@/server/support/clock';

export interface AuditTarget {
  type: string;
  id: number;
}

/**
 * Appends one entry to the audit log (administration/record-audit-log, L2-069). Called inside a
 * business transaction, it commits or rolls back with the change it describes. The time is the
 * API's clock (frozen in the e2e API and the tests, so the viewer shows what the mocks show); the
 * address is the client's as the trusted proxies report it, or none for a queued job.
 */
export async function recordAuditEntry(
  entry: {
    actor: CurrentUser | null;
    action: AuditAction;
    target: AuditTarget | null;
    outcome: AuditOutcome;
    context?: Record<string, unknown>;
    request?: NextRequest;
  },
  database: Database | Transaction = db(),
): Promise<void> {
  await database.insert(auditEntries).values({
    actorId: entry.actor?.id ?? null,
    actorRole: entry.actor?.roles[0] ?? null,
    action: entry.action,
    targetType: entry.target?.type ?? null,
    targetId: entry.target?.id ?? null,
    occurredAt: now().toJSDate(),
    ipAddress: entry.request === undefined ? null : clientAddress(entry.request),
    outcome: entry.outcome,
    context: entry.context ?? {},
  });
}
