import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { reloadConfig } from '@config/zamaro';
import { grantRole } from '@/server/actions/accounts/grant-role';
import { recordAuditEntry } from '@/server/actions/audit/record-audit-entry';
import { db } from '@/server/db/client';
import { AuditAction, AuditOutcome, Role } from '@/server/enums';
import { loadCurrentUser } from '@/server/services/accounts/current-user';
import { Browser, freshBooker, signedIn } from '../../support/accounts';
import { travelTo } from '../../support/clock';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { currentCode, turnOnTwoFactor } from '../../support/two-factor';

/** A load balancer or the web app's server, on the private network the suite trusts. */
const PROXY = '10.0.0.5';
const PRIYA_AT_HOME = '99.230.14.8';

interface Entry extends Record<string, unknown> {
  id: number;
  action: string;
  outcome: string;
  actor_id: number | null;
  target_id: number | null;
  ip_address: string | null;
  occurred_at: string;
  context: Record<string, unknown>;
}

/**
 * L2-069.1 (administration/record-audit-log): sign-ins, code steps and role changes are each written
 * to the audit log with the actor, the target, the outcome and the address the request came from, as
 * the trusted proxies report it. Secrets never reach an entry, and an entry rolls back with its change.
 */
describe('recording the audit log', () => {
  let email: string;
  let userId: number;
  let secret: string;

  beforeAll(async () => {
    process.env.TRUSTED_PROXIES = '10.0.0.0/8';
    reloadConfig();
    await freshDatabase();
  });

  afterAll(() => {
    delete process.env.TRUSTED_PROXIES;
    reloadConfig();
    return closeDatabase();
  });

  beforeEach(async () => {
    await freshDatabase();
    travelTo('2026-10-09 11:41');
    email = await freshBooker();
    const [row] = await query<{ id: number }>(sql`select id from users where email = ${email}`);
    userId = row?.id ?? 0;
    ({ secret } = await turnOnTwoFactor(await signedIn(email)));
  });

  it('writes both steps of a password-and-code sign-in with the forwarded address', async () => {
    const since = await lastEntryId();

    expect((await signInWithCode(currentCode(secret), PROXY)).status).toBe(200);

    const entries = await entriesAfter(since);
    expect(entries.map((entry) => entry.action)).toEqual(['auth.mfa_challenge', 'auth.sign_in']);
    for (const entry of entries) {
      expect(entry.outcome).toBe(AuditOutcome.Succeeded);
      expect(entry.actor_id).toBe(userId);
      expect(entry.ip_address).toBe(PRIYA_AT_HOME);
    }
  });

  it('takes the frozen time on a frozen clock, so the viewer matches the mocks', async () => {
    const since = await lastEntryId();

    expect((await signInWithCode(currentCode(secret), PROXY)).status).toBe(200);

    const entries = await entriesAfter(since);
    const latest = entries[entries.length - 1];
    expect(new Date(latest?.occurred_at ?? 0).toISOString()).toBe('2026-10-09T15:41:00.000Z');
  });

  it('ignores a forwarded address from a caller that is not a trusted proxy', async () => {
    const since = await lastEntryId();

    expect((await signInWithCode(currentCode(secret), '203.0.113.9')).status).toBe(200);

    const addresses = new Set((await entriesAfter(since)).map((entry) => entry.ip_address));
    expect([...addresses]).toEqual(['203.0.113.9']);
  });

  it('writes a failed code step for a wrong code', async () => {
    const since = await lastEntryId();

    expect((await signInWithCode('000000', PROXY)).status).toBe(422);

    const [entry, ...rest] = await entriesAfter(since);
    expect(rest).toHaveLength(0);
    expect(entry?.action).toBe(AuditAction.MfaChallenge);
    expect(entry?.outcome).toBe(AuditOutcome.Failed);
    expect(entry?.actor_id).toBe(userId);
  });

  it('writes a role change by the system once when a role is granted', async () => {
    const since = await lastEntryId();

    await grantRole(userId, Role.Administrator, null);
    await grantRole(userId, Role.Administrator, null);

    const [entry, ...rest] = await entriesAfter(since);
    expect(rest).toHaveLength(0);
    expect(entry?.action).toBe(AuditAction.RoleChanged);
    expect(
      entry?.actor_id,
      'No one signed in made the change: the actor is the system.',
    ).toBeNull();
    expect(entry?.target_id).toBe(userId);
    expect(entry?.context).toEqual({ granted: 'admin' });
    expect((await loadCurrentUser(userId))?.roles).toContain(Role.Administrator);
  });

  it('never lets a password in the context reach the entry', async () => {
    const since = await lastEntryId();

    await recordAuditEntry({
      actor: null,
      action: AuditAction.SignInFailed,
      target: null,
      outcome: AuditOutcome.Failed,
      context: { email: 'admin@riversidecc.ca', password: 'hosanna-in-the-highest' },
    });

    const [entry] = await entriesAfter(since);
    expect(JSON.stringify(entry?.context)).not.toContain('hosanna-in-the-highest');
    expect(entry?.context).toEqual({ email: 'admin@riversidecc.ca', password: '[REDACTED]' });
  });

  it('loses an entry written in a transaction that rolls back', async () => {
    const since = await lastEntryId();
    const actor = await loadCurrentUser(userId);

    await expect(
      db().transaction(async (tx) => {
        await recordAuditEntry(
          {
            actor,
            action: AuditAction.RoleChanged,
            target: { type: 'user', id: userId },
            outcome: AuditOutcome.Succeeded,
          },
          tx,
        );
        throw new Error('the change it describes failed');
      }),
    ).rejects.toThrow('the change it describes failed');

    expect(await entriesAfter(since)).toEqual([]);
  });

  async function signInWithCode(code: string, from: string): Promise<Response> {
    const browser = new Browser();
    browser.address = `${PRIYA_AT_HOME}, ${from}`;
    expect((await browser.signIn(email)).status).toBe(202);
    return browser.json('/api/v1/session/two-factor', 'POST', { code });
  }

  async function lastEntryId(): Promise<number> {
    const [row] = await query<{ max: number | null }>(
      sql`select max(id)::int as max from audit_entries`,
    );
    return row?.max ?? 0;
  }

  function entriesAfter(id: number): Promise<Entry[]> {
    return query<Entry>(
      sql`select id, action, outcome::text as outcome, actor_id, target_id, ip_address, occurred_at, context
          from audit_entries where id > ${id} order by id`,
    );
  }
});
