import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pruneAuditEntries } from '@/cli/audit-prune';
import { db } from '@/server/db/client';
import { auditEntries } from '@/server/db/schema';
import { AuditAction, AuditOutcome } from '@/server/enums';
import { torontoTime } from '@/server/support/clock';
import { travelTo } from '../../support/clock';
import { closeDatabase, freshDatabase, query } from '../../support/database';

/**
 * L2-069.3, L2-092 (administration/record-audit-log, ADR-0022): `audit:prune` deletes entries older
 * than 2 years, as the retention role, in batches; a second run deletes nothing, and a missed day is
 * caught up by the next run.
 */
describe('pruning audit entries', () => {
  beforeAll(async () => {
    await freshDatabase({ seed: false });
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase({ seed: false });
    travelTo('2026-10-09 03:30');
  });

  it('deletes entries older than two years and keeps newer ones', async () => {
    await entry('2024-10-08 12:00');
    await entry('2024-10-10 12:00');
    await entry('2024-06-01 12:00');

    expect(await pruneAuditEntries()).toBe(2);

    const left = await query<{ occurred_at: string }>(sql`select occurred_at from audit_entries`);
    expect(left.map((row) => new Date(row.occurred_at).toISOString())).toEqual([
      '2024-10-10T16:00:00.000Z',
    ]);
  });

  it('deletes nothing on a second run', async () => {
    await entry('2024-10-08 12:00');
    expect(await pruneAuditEntries()).toBe(1);

    expect(await pruneAuditEntries()).toBe(0);

    expect(await query(sql`select id from audit_entries`)).toEqual([]);
  });

  it('deletes in batches of 1000', async () => {
    const rows = Array.from({ length: 1500 }, (_, i) => ({
      action: AuditAction.SignIn,
      outcome: AuditOutcome.Succeeded,
      context: {},
      occurredAt: new Date(torontoTime('2024-01-01 12:00:00').getTime() + (i + 1) * 60_000),
    }));
    for (let start = 0; start < rows.length; start += 500) {
      await db()
        .insert(auditEntries)
        .values(rows.slice(start, start + 500));
    }

    expect(await pruneAuditEntries()).toBe(1500);

    expect(await query(sql`select id from audit_entries`)).toEqual([]);
  });

  async function entry(at: string): Promise<void> {
    await db()
      .insert(auditEntries)
      .values({
        action: AuditAction.SignIn,
        outcome: AuditOutcome.Succeeded,
        context: {},
        occurredAt: torontoTime(`${at}:00`),
      });
  }
});
