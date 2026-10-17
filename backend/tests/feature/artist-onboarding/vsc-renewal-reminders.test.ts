import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { sendVscRenewalReminders } from '@/cli/vsc-renewal-reminders';
import { db } from '@/server/db/client';
import { vulnerableSectorChecks } from '@/server/db/schema';
import { VscStatus } from '@/server/enums';
import { now } from '@/server/support/clock';
import { travelTo } from '../../support/clock';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { sentEmails } from '../../support/mail';

/**
 * L2-049.3, L2-063, L2-092 (verify-vulnerable-sector-check): the daily run emails an artist whose
 * verified check runs out within 60 days, once, with a link to the profile editor's check section.
 * The cast's Daniel & Ruth Okonkwo hold a check verified until Mon 30 Nov 2026, 52 days from today.
 */
describe('vulnerable sector check renewal reminders', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    travelTo('2026-10-09 09:00');
  });

  it('emails the artist whose check runs out within 60 days on the daily run', async () => {
    expect(await sendVscRenewalReminders()).toBe(1);

    const [email, ...rest] = sentEmails();
    expect(rest).toHaveLength(0);
    expect(email?.to.address).toBe(await danielsEmail());
    expect(email?.subject).toBe('Renew your Vulnerable Sector Check by Mon 30 Nov 2026');
    expect(email?.html).toContain('Hi Daniel,');
    expect(email?.html).toContain('Renew by Mon 30 Nov 2026');
    expect(email?.html).toContain(`${config().webUrl}/artist/profile#check`);
    expect(await reminderSentAt()).toBe(now().toUTC().toISO());
  });

  it('sends nothing on a second run', async () => {
    expect(await sendVscRenewalReminders()).toBe(1);

    expect(await sendVscRenewalReminders()).toBe(0);

    expect(sentEmails()).toHaveLength(1);
  });

  it('sends no reminder for a check replaced by a newer verified one', async () => {
    await db()
      .insert(vulnerableSectorChecks)
      .values({
        userId: await danielsUserId(),
        issuedOn: '2026-09-20',
        expiresOn: '2029-09-20',
        status: VscStatus.Verified,
        verifiedAt: now().toJSDate(),
      });

    expect(await sendVscRenewalReminders()).toBe(0);

    expect(sentEmails()).toEqual([]);
    expect(await reminderSentAt()).toBeNull();
  });

  it('catches a run missed on the day the window opened on the next day', async () => {
    // The window opened on Thu 1 Oct; nothing ran until Fri 2 Oct.
    travelTo('2026-10-02 09:00');

    expect(await sendVscRenewalReminders()).toBe(1);

    expect(sentEmails().map((email) => email.to.address)).toEqual([await danielsEmail()]);
  });

  it('sends no reminder for a check outside the window or already expired', async () => {
    // 61 days before Daniel & Ruth's expiry: not yet.
    travelTo('2026-09-30 09:00');
    expect(await sendVscRenewalReminders()).toBe(0);

    // Expired: the editor says "Expired" and Youth event searches no longer list them; no reminder.
    travelTo('2026-12-01 09:00');
    expect(await sendVscRenewalReminders()).toBe(0);

    expect(sentEmails()).toEqual([]);
  });

  async function danielsUserId(): Promise<number> {
    const [row] = await query<{ user_id: number }>(
      sql`select user_id from artists where slug = 'daniel-and-ruth-okonkwo'`,
    );
    return row?.user_id ?? 0;
  }

  async function danielsEmail(): Promise<string> {
    const [row] = await query<{ email: string }>(
      sql`select email from users where id = ${await danielsUserId()}`,
    );
    return row?.email ?? '';
  }

  async function reminderSentAt(): Promise<string | null> {
    const [row] = await query<{ renewal_reminder_sent_at: string | null }>(
      sql`select renewal_reminder_sent_at from vulnerable_sector_checks
          where user_id = ${await danielsUserId()} and expires_on = '2026-11-30'`,
    );
    return row?.renewal_reminder_sent_at === null || row?.renewal_reminder_sent_at === undefined
      ? null
      : new Date(row.renewal_reminder_sent_at).toISOString();
  }
});
