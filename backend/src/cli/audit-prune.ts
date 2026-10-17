import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { rows } from '@/server/db/raw';
import { now } from '@/server/support/clock';
import { run } from './run';

/**
 * `npm run audit:prune`: deletes audit entries older than 2 years (L2-069.3), 1,000 at a time, as
 * the retention role: the one role the append-only trigger lets delete (ADR-0022). Each batch is its
 * own transaction, so a run that stops leaves nothing half done, and running it again deletes only
 * what is now due (L2-092). The daily run belongs to the scheduler (M3 D14).
 *
 * @returns how many entries went
 */
export const RETAIN_YEARS = 2;
export const PRUNE_BATCH = 1000;

export async function pruneAuditEntries(): Promise<number> {
  const cutoff = now().minus({ years: RETAIN_YEARS }).toJSDate();
  let deleted = 0;
  let batch: number;
  do {
    batch = await db().transaction(async (tx) => {
      await tx.execute(sql`set local role zamaro_audit_retention`);
      const gone = await rows<{ id: number }>(
        sql`delete from audit_entries where id in (
              select id from audit_entries where occurred_at < ${cutoff} order by id limit ${PRUNE_BATCH}
            ) returning id`,
        tx,
      );
      return gone.length;
    });
    deleted += batch;
  } while (batch === PRUNE_BATCH);
  return deleted;
}

if (process.argv[1]?.endsWith('audit-prune.ts') === true) {
  run(async () => {
    const deleted = await pruneAuditEntries();
    console.log(
      `Deleted ${String(deleted)} audit entries older than ${String(RETAIN_YEARS)} years.`,
    );
  });
}
