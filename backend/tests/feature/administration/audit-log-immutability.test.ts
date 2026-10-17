import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { recordAuditEntry } from '@/server/actions/audit/record-audit-entry';
import { AuditAction, AuditOutcome } from '@/server/enums';
import { closeDatabase, freshDatabase, query } from '../../support/database';

/**
 * L2-069.2 (administration/record-audit-log): nothing changes or deletes an entry. The database
 * refuses a raw UPDATE from anyone and a raw DELETE from anyone but the retention role that
 * audit:prune uses.
 */
describe('audit log immutability', () => {
  let entryId: number;

  beforeAll(async () => {
    await freshDatabase({ seed: false });
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase({ seed: false });
    await recordAuditEntry({
      actor: null,
      action: AuditAction.SignInFailed,
      target: null,
      outcome: AuditOutcome.Failed,
      context: { email: 'admin@riversidecc.ca' },
    });
    const [row] = await query<{ id: number }>(sql`select id from audit_entries`);
    entryId = row?.id ?? 0;
  });

  it('refuses a raw update or delete from the application', async () => {
    await expect(
      query(sql`update audit_entries set outcome = 'succeeded' where id = ${entryId}`),
    ).rejects.toThrow();
    await expect(query(sql`delete from audit_entries where id = ${entryId}`)).rejects.toThrow();

    expect(await outcome()).toBe('failed');
  });

  it('lets the retention role delete but never update', async () => {
    await query(sql`set role zamaro_audit_retention`);
    try {
      // The role holds no UPDATE privilege, so the database refuses before the trigger runs.
      await expect(
        query(sql`update audit_entries set outcome = 'succeeded' where id = ${entryId}`),
      ).rejects.toThrow();
      await query(sql`delete from audit_entries where id = ${entryId}`);
    } finally {
      await query(sql`reset role`);
    }

    expect(await query(sql`select id from audit_entries where id = ${entryId}`)).toEqual([]);
  });

  async function outcome(): Promise<string | undefined> {
    const [row] = await query<{ outcome: string }>(
      sql`select outcome::text as outcome from audit_entries where id = ${entryId}`,
    );
    return row?.outcome;
  }
});
