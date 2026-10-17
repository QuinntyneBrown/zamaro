import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { db } from '@/server/db/client';
import { vulnerableSectorChecks } from '@/server/db/schema';
import { AuditAction, VscStatus } from '@/server/enums';
import type { Browser } from '../../support/accounts';
import { PRIYA_EMAIL, PRIYA_TOTP_SECRET, signInWithCode } from '../../support/admin';
import { api } from '../../support/app';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const QUEUE = '/api/v1/admin/vulnerable-sector-checks';
const INDEX = { method: 'get', path: '/admin/vulnerable-sector-checks' };
const VERIFY = { method: 'post', path: '/admin/vulnerable-sector-checks/{check}/verification' };
const BURLINGTON = 'lat=43.325&lng=-79.799&radius=120';

interface QueueRow {
  id: number;
  artist: { id: number | null; name: string; slug: string | null };
  status: string;
  issuedOn: string;
  uploadedAt: string;
  expiresOn: string | null;
  verifiedAt: string | null;
  verifiedBy: { name: string } | null;
  replaces: { verifiedUntil: string } | null;
}

interface QueuePage {
  data: QueueRow[];
  meta: { waiting: number };
}

/**
 * L2-049.2, L2-069.1 (verify-vulnerable-sector-check): the admin queue lists checks waiting, oldest
 * first; verifying one makes the artist eligible for Youth events for 3 years from the issue date
 * and is audited; a check issued more than 3 years ago is refused, and a second decision is a conflict.
 */
describe('verifying a vulnerable sector check', () => {
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

  it('lists the checks waiting, oldest first, with what they replace', async () => {
    const response = await priya.json(QUEUE, 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as QueuePage;
    expect(body.meta.waiting).toBe(2);
    expectContract(response, INDEX, body);
    expect(body.data.map((row) => row.artist.name)).toEqual(['Elijah Park', 'Abigail Mensah']);
    const elijah = body.data[0];
    expect(elijah?.issuedOn).toBe('2026-09-25');
    expect(new Date(elijah?.uploadedAt ?? 0).toISOString()).toBe('2026-10-07T20:10:00.000Z');
    expect(elijah?.status).toBe('pending');
    expect(elijah?.replaces).toBeNull();
    const abigail = body.data[1];
    expect(abigail?.issuedOn).toBe('2026-10-05');
    expect(new Date(abigail?.uploadedAt ?? 0).toISOString()).toBe('2026-10-09T13:52:00.000Z');
    expect(abigail?.replaces).toEqual({ verifiedUntil: '2028-03-03' });
  });

  it('counts a verified check for three years from its issue date, and audits it', async () => {
    const elijah = await pendingCheckOf('elijah-park');
    expect(await youthLineupOn('2026-11-14')).not.toContain('Elijah Park');

    const response = await priya.json(`${QUEUE}/${String(elijah)}/verification`, 'POST');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: QueueRow };
    expect(body.data.status).toBe('verified');
    expect(body.data.expiresOn).toBe('2029-09-25');
    expect(new Date(body.data.verifiedAt ?? 0).toISOString()).toBe('2026-10-09T14:00:00.000Z');
    expect(body.data.verifiedBy?.name).toBe('Priya Nair');
    expectContract(response, VERIFY, body);
    const [check] = await query<{ status: string; verified_by: number }>(
      sql`select status::text as status, verified_by from vulnerable_sector_checks where id = ${elijah}`,
    );
    expect(check?.status).toBe(VscStatus.Verified);
    const [priyaRow] = await query<{ id: number }>(
      sql`select id from users where email = ${PRIYA_EMAIL}`,
    );
    expect(check?.verified_by).toBe(priyaRow?.id);
    const entries = await query<{ actor_id: number; target_id: number }>(
      sql`select actor_id, target_id from audit_entries where action = ${AuditAction.VscVerified}`,
    );
    expect(entries).toEqual([{ actor_id: priyaRow?.id, target_id: elijah }]);
    expect(await youthLineupOn('2026-11-14')).toContain('Elijah Park');
    const queue = (await (await priya.json(QUEUE, 'GET')).json()) as QueuePage;
    expect(queue.meta.waiting).toBe(1);
  });

  it('refuses a check issued more than three years ago', async () => {
    const [marcus] = await query<{ user_id: number }>(
      sql`select user_id from artists where slug = 'marcus-bell-trio'`,
    );
    const [old] = await db()
      .insert(vulnerableSectorChecks)
      .values({ userId: marcus?.user_id ?? 0, issuedOn: '2023-10-01', status: VscStatus.Pending })
      .returning({ id: vulnerableSectorChecks.id });

    const response = await priya.json(`${QUEUE}/${String(old?.id ?? 0)}/verification`, 'POST');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.issuedOn?.[0]).toBe(
      'This check was issued more than 3 years ago. Ask the artist for a newer one.',
    );
    const [check] = await query<{ status: string }>(
      sql`select status::text as status from vulnerable_sector_checks where id = ${old?.id ?? 0}`,
    );
    expect(check?.status).toBe(VscStatus.Pending);
  });

  it('treats a second verification as a conflict', async () => {
    const elijah = await pendingCheckOf('elijah-park');
    expect((await priya.json(`${QUEUE}/${String(elijah)}/verification`, 'POST')).status).toBe(200);

    const response = await priya.json(`${QUEUE}/${String(elijah)}/verification`, 'POST');

    expect(response.status).toBe(409);
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/vsc-already-decided`);
    expectContract(response, VERIFY, body);
    expect(
      await query(sql`select id from audit_entries where action = ${AuditAction.VscVerified}`),
    ).toHaveLength(1);
  });

  async function pendingCheckOf(slug: string): Promise<number> {
    const rows = await query<{ id: number }>(
      sql`select c.id from vulnerable_sector_checks c join artists a on a.user_id = c.user_id
          where a.slug = ${slug} and c.status = 'pending'`,
    );
    expect(rows).toHaveLength(1);
    return rows[0]?.id ?? 0;
  }

  async function youthLineupOn(date: string): Promise<string[]> {
    const response = await api(`/api/v1/search?date=${date}&kind=youth-event&${BURLINGTON}`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      headliner: { name: string } | null;
      data: { name: string }[];
    };
    return [body.headliner?.name, ...body.data.map((card) => card.name)].filter(
      (name): name is string => name !== undefined,
    );
  }
});
