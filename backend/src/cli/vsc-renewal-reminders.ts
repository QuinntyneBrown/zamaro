import { and, asc, between, eq, isNull, notExists, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/server/db/client';
import { users, vulnerableSectorChecks } from '@/server/db/schema';
import { VscStatus } from '@/server/enums';
import { sendVscRenewalReminder } from '@/server/notifications/artist-onboarding/vsc-renewal-reminder';
import { now, today } from '@/server/support/clock';
import { run } from './run';

/**
 * `npm run vsc:send-renewal-reminders`: the daily run that emails an artist whose verified Vulnerable
 * Sector Check runs out within 60 days (verify-vulnerable-sector-check, L2-049.3). Each check is
 * reminded once: the stamp is set with a conditional update before the email is queued, so a second
 * run and a missed day both come out right (L2-092.2, L2-092.3). A check the artist has already
 * replaced with a newer verified one needs no reminder.
 *
 * @returns how many reminders went
 */
export const REMINDER_WINDOW_DAYS = 60;

export async function sendVscRenewalReminders(): Promise<number> {
  const from = today();
  const until = now().plus({ days: REMINDER_WINDOW_DAYS }).toISODate() ?? from;
  const newer = alias(vulnerableSectorChecks, 'newer');
  const due = await db()
    .select({
      id: vulnerableSectorChecks.id,
      expiresOn: vulnerableSectorChecks.expiresOn,
      name: users.name,
      email: users.email,
    })
    .from(vulnerableSectorChecks)
    .innerJoin(users, eq(users.id, vulnerableSectorChecks.userId))
    .where(
      and(
        eq(vulnerableSectorChecks.status, VscStatus.Verified),
        isNull(vulnerableSectorChecks.renewalReminderSentAt),
        between(vulnerableSectorChecks.expiresOn, from, until),
        notExists(
          db()
            .select({ one: sql`1` })
            .from(newer)
            .where(
              and(
                eq(newer.userId, vulnerableSectorChecks.userId),
                eq(newer.status, VscStatus.Verified),
                sql`${newer.expiresOn} > ${vulnerableSectorChecks.expiresOn}`,
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(vulnerableSectorChecks.expiresOn), asc(vulnerableSectorChecks.id));

  let sent = 0;
  for (const check of due) {
    const claimed = await db()
      .update(vulnerableSectorChecks)
      .set({ renewalReminderSentAt: now().toJSDate() })
      .where(
        and(
          eq(vulnerableSectorChecks.id, check.id),
          isNull(vulnerableSectorChecks.renewalReminderSentAt),
        ),
      )
      .returning({ id: vulnerableSectorChecks.id });
    if (claimed.length === 1 && check.expiresOn !== null) {
      await sendVscRenewalReminder({ name: check.name, email: check.email }, check.expiresOn);
      sent++;
    }
  }
  return sent;
}

if (process.argv[1]?.endsWith('vsc-renewal-reminders.ts') === true) {
  run(async () => {
    const sent = await sendVscRenewalReminders();
    console.log(`Sent ${String(sent)} renewal reminder${sent === 1 ? '' : 's'}.`);
  });
}
