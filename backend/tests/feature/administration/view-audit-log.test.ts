import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { auditEntries } from '@/server/db/schema';
import { AuditAction, AuditOutcome } from '@/server/enums';
import { torontoTime } from '@/server/support/clock';
import { ABIGAIL, Browser, NAOMI } from '../../support/accounts';
import { PRIYA_EMAIL, PRIYA_TOTP_SECRET, signInWithCode } from '../../support/admin';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const ENTRIES = { method: 'get', path: '/admin/audit-entries' };

interface EntryRow {
  id: number;
  occurredAt: string;
  actor: { name: string; email: string; role: string | null } | null;
  attemptedEmail: string | null;
  action: string;
  target: { type: string; label: string | null } | null;
  ipAddress: string | null;
  outcome: string;
}

interface Page {
  data: EntryRow[];
  meta: { perPage: number; nextCursor: string | null };
}

interface Person {
  id: number;
  role: string;
}

/**
 * L2-069.2–.3, L2-095.1 (administration/record-audit-log): an administrator reads the audit log,
 * newest first, filtered and paged by cursor; nothing changes or deletes an entry.
 */
describe('viewing the audit log', () => {
  let priya: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    priya = await signInWithCode(PRIYA_EMAIL, PRIYA_TOTP_SECRET);
  });

  it('lists entries newest first with actor, target, address and outcome', async () => {
    const abigail = await person(ABIGAIL);
    const booking = await bookingId('ZAM-0101');
    await entry(
      abigail,
      AuditAction.PasswordChanged,
      { type: 'user', id: abigail.id },
      AuditOutcome.Succeeded,
      '2026-10-09 09:36',
      '142.112.60.21',
    );
    await entry(
      null,
      AuditAction.SignInFailed,
      null,
      AuditOutcome.Failed,
      '2026-10-09 03:12',
      '185.220.101.7',
      { email: 'admin@riversidecc.ca' },
    );
    await entry(
      null,
      AuditAction.SignIn,
      { type: 'booking', id: booking },
      AuditOutcome.Succeeded,
      '2026-10-09 08:05',
      null,
    );

    const response = await priya.json('/api/v1/admin/audit-entries', 'GET');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const body = (await response.json()) as Page;
    expectContract(response, ENTRIES, body);
    // Priya's own code step and sign-in from the setup come first, then the three entries above.
    expect(body.data.map((row) => row.action)).toEqual([
      'auth.sign_in',
      'auth.mfa_challenge',
      'auth.password_changed',
      'auth.sign_in',
      'auth.sign_in_failed',
    ]);
    const changed = body.data[2];
    expect(new Date(changed?.occurredAt ?? 0).toISOString()).toBe('2026-10-09T13:36:00.000Z');
    expect(changed?.actor).toEqual({ name: 'Abigail Mensah', email: ABIGAIL, role: 'artist' });
    expect(changed?.target).toEqual({ type: 'User', label: 'Abigail Mensah' });
    expect(changed?.ipAddress).toBe('142.112.60.21');
    expect(changed?.outcome).toBe('succeeded');
    const failed = body.data[4];
    expect(failed?.actor).toBeNull();
    expect(failed?.attemptedEmail).toBe('admin@riversidecc.ca');
    expect(failed?.target).toBeNull();
    const system = body.data[3];
    expect(system?.actor).toBeNull();
    expect(system?.attemptedEmail).toBeNull();
    expect(system?.target).toEqual({ type: 'Booking', label: 'ZAM-0101' });
    expect(system?.ipAddress).toBeNull();
  });

  it('narrows by actor email, action, target, outcome and dates', async () => {
    const abigail = await person(ABIGAIL);
    const naomi = await person(NAOMI);
    await entry(
      abigail,
      AuditAction.PasswordChanged,
      { type: 'user', id: abigail.id },
      AuditOutcome.Succeeded,
      '2026-10-09 09:36',
      '142.112.60.21',
    );
    await entry(
      abigail,
      AuditAction.SignInFailed,
      { type: 'user', id: abigail.id },
      AuditOutcome.Failed,
      '2026-10-09 09:30',
      '142.112.60.21',
    );
    await entry(
      naomi,
      AuditAction.SignIn,
      { type: 'user', id: naomi.id },
      AuditOutcome.Succeeded,
      '2026-10-01 08:00',
      '99.230.14.9',
    );
    await entry(
      naomi,
      AuditAction.SignIn,
      { type: 'user', id: naomi.id },
      AuditOutcome.Succeeded,
      '2026-09-30 23:59',
      '99.230.14.9',
    );

    const byActor = await list('?actor=ABIGAIL@abigailmensah.ca');
    expect(byActor.data.map((row) => row.action)).toEqual([
      'auth.password_changed',
      'auth.sign_in_failed',
    ]);
    const byAction = await list('?action=auth.sign_in_failed');
    expect(byAction.data).toHaveLength(1);
    const byOutcome = await list('?outcome=failed&actor=abigail@abigailmensah.ca');
    expect(byOutcome.data.map((row) => row.action)).toEqual(['auth.sign_in_failed']);
    const byTarget = await list('?target=Naomi');
    expect(byTarget.data).toHaveLength(2);
    const byDates = await list('?from=2026-10-01&to=2026-10-08');
    expect(byDates.data.map((row) => new Date(row.occurredAt).toISOString())).toEqual([
      '2026-10-01T12:00:00.000Z',
    ]);

    const backwards = await priya.json(
      '/api/v1/admin/audit-entries?from=2026-10-09&to=2026-10-01',
      'GET',
    );
    expect(backwards.status).toBe(422);
    expect(((await backwards.json()) as { errors: object }).errors).toHaveProperty('to');
    const maybe = await priya.json('/api/v1/admin/audit-entries?outcome=maybe', 'GET');
    expect(maybe.status).toBe(422);
    expect(((await maybe.json()) as { errors: object }).errors).toHaveProperty('outcome');
  });

  it('pages older entries by cursor, 50 at a time', async () => {
    const naomi = await person(NAOMI);
    for (let minute = 1; minute <= 60; minute++) {
      const at = `2026-10-01 ${String(8 + Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
      await entry(
        naomi,
        AuditAction.SignIn,
        { type: 'user', id: naomi.id },
        AuditOutcome.Succeeded,
        at,
        '99.230.14.9',
      );
    }

    const first = await list('?actor=naomi.fraser@riversidecc.ca');
    expect(first.data).toHaveLength(50);
    expect(first.meta.perPage).toBe(50);
    expect(new Date(first.data[0]?.occurredAt ?? 0).toISOString()).toBe('2026-10-01T13:00:00.000Z');
    expect(first.meta.nextCursor).not.toBeNull();

    const response = await priya.json(
      `/api/v1/admin/audit-entries?actor=naomi.fraser@riversidecc.ca&cursor=${encodeURIComponent(first.meta.nextCursor ?? '')}`,
      'GET',
    );
    expect(response.status).toBe(200);
    const second = (await response.json()) as Page;
    expect(second.data).toHaveLength(10);
    expect(new Date(second.data[9]?.occurredAt ?? 0).toISOString()).toBe(
      '2026-10-01T12:01:00.000Z',
    );
    expect(second.meta.nextCursor).toBeNull();
    expectContract(response, ENTRIES, second);
  });

  it('lets nothing change or delete an entry', async () => {
    const [latest] = await query<{ id: number }>(
      sql`select id from audit_entries where action = 'auth.sign_in' order by id desc limit 1`,
    );
    const path = `/api/v1/admin/audit-entries/${String(latest?.id ?? 0)}`;

    expect((await priya.json(path, 'PATCH', { outcome: 'failed' })).status).toBe(405);
    expect((await priya.json(path, 'DELETE')).status).toBe(405);
    expect((await priya.json(path, 'PUT', { outcome: 'failed' })).status).toBe(405);

    const shown = await priya.json(path, 'GET');
    expect(shown.status).toBe(200);
    expect(((await shown.json()) as { data: EntryRow }).data.outcome).toBe('succeeded');
    const [row] = await query<{ outcome: string }>(
      sql`select outcome::text as outcome from audit_entries where id = ${latest?.id ?? 0}`,
    );
    expect(row?.outcome).toBe('succeeded');
  });

  async function list(queryString: string): Promise<Page> {
    const response = await priya.json(`/api/v1/admin/audit-entries${queryString}`, 'GET');
    expect(response.status, queryString).toBe(200);
    return (await response.json()) as Page;
  }

  async function entry(
    actor: Person | null,
    action: AuditAction,
    target: { type: string; id: number } | null,
    outcome: AuditOutcome,
    at: string,
    ip: string | null,
    context: Record<string, unknown> = {},
  ): Promise<void> {
    await db()
      .insert(auditEntries)
      .values({
        actorId: actor?.id ?? null,
        actorRole: actor?.role ?? null,
        action,
        targetType: target?.type ?? null,
        targetId: target?.id ?? null,
        occurredAt: torontoTime(`${at}:00`),
        ipAddress: ip,
        outcome,
        context,
      });
  }

  async function person(email: string): Promise<Person> {
    const [row] = await query<{ id: number; role: string }>(
      sql`select u.id, r.name as role from users u join role_user ru on ru.user_id = u.id join roles r on r.id = ru.role_id
          where u.email = ${email} order by r.id limit 1`,
    );
    return { id: row?.id ?? 0, role: row?.role ?? '' };
  }

  async function bookingId(number: string): Promise<number> {
    const [row] = await query<{ id: number }>(
      sql`select id from bookings where number = ${number}`,
    );
    return row?.id ?? 0;
  }
});
