import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { grantAdministrator } from '@/cli/admin-grant';
import { db } from '@/server/db/client';
import { vulnerableSectorChecks } from '@/server/db/schema';
import { AuditAction, Role, VscStatus } from '@/server/enums';
import { Browser, freshBooker, signedIn } from '../../support/accounts';
import {
  expectConcealed,
  makeAdministratorWithTwoStep,
  PRIYA_EMAIL,
  PRIYA_TOTP_SECRET,
  signInWithCode,
  unknownAddressProblem,
} from '../../support/admin';
import { resetClock, travel } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';
import { currentCode, turnOnTwoFactor } from '../../support/two-factor';

const OVERVIEW = { method: 'get', path: '/admin/overview' };
const TURN_OFF = { method: 'delete', path: '/account/two-factor' };

/**
 * L2-066.1–.2 (administration/secure-admin-access): the admin API answers only an administrator who
 * signed in with a code, and an administrator's session ends after 30 minutes without a request.
 * Administrators are made by `admin:grant` (M3 D6) and cannot turn two-step sign-in off.
 */
describe('secure admin access', () => {
  let email: string;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    email = await freshBooker();
  });

  it('records a role change by the system when the role is granted from the console', async () => {
    expect(await grantAdministrator(email.toUpperCase())).toContain('is now an administrator');
    await grantAdministrator(email);

    const roles = await query<{ name: string }>(
      sql`select r.name from roles r join role_user ru on ru.role_id = r.id join users u on u.id = ru.user_id where u.email = ${email}`,
    );
    expect(roles.map((role) => role.name)).toContain(Role.Administrator);
    const entries = await query<{ actor_id: number | null; target_id: number }>(
      sql`select actor_id, target_id from audit_entries where action = ${AuditAction.RoleChanged}`,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]?.actor_id).toBeNull();
    expect(entries[0]?.target_id).toBe(await idOf(email));
  });

  it('fails to grant the role to an address with no account', async () => {
    await expect(grantAdministrator('nobody@zamaro.ca')).rejects.toThrow(
      'No account has the address',
    );

    expect(
      await query(sql`select id from audit_entries where action = ${AuditAction.RoleChanged}`),
    ).toEqual([]);
  });

  it('signs the seeded administrator Priya in with her seeded key', async () => {
    const browser = new Browser();
    const pending = await browser.signIn(PRIYA_EMAIL);
    expect(pending.status).toBe(202);
    expect(((await pending.json()) as { data: { email: string } }).data.email).toBe(PRIYA_EMAIL);

    const signedInResponse = await browser.json('/api/v1/session/two-factor', 'POST', {
      code: currentCode(PRIYA_TOTP_SECRET),
    });

    expect(signedInResponse.status).toBe(200);
    const body = (await signedInResponse.json()) as { data: { name: string; roles: string[] } };
    expect(body.data.name).toBe('Priya Nair');
    expect(body.data.roles).toEqual(['admin']);
    expect((await browser.json('/api/v1/admin/overview', 'GET')).status).toBe(200);
  });

  it('shows an administrator signed in with a code the overview', async () => {
    const secret = await makeAdministratorWithTwoStep(email);
    const userId = await idOf(email);
    await db()
      .insert(vulnerableSectorChecks)
      .values([
        { userId, issuedOn: '2026-09-25', expiresOn: '2029-09-25', status: VscStatus.Pending },
        { userId, issuedOn: '2026-10-05', expiresOn: '2029-10-05', status: VscStatus.Pending },
        { userId, issuedOn: '2025-03-03', expiresOn: '2028-03-03', status: VscStatus.Verified },
      ]);

    const browser = await signInWithCode(email, secret);
    const response = await browser.json('/api/v1/admin/overview', 'GET');

    // Two waiting from the seed (Elijah's and Abigail's) plus the two above.
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { checksWaiting: 4 } });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expectContract(response, OVERVIEW, { data: { checksWaiting: 4 } });
  });

  it('answers not found on the admin API after the password alone', async () => {
    await makeAdministratorWithTwoStep(email);
    const browser = new Browser();
    const response = await browser.signIn(email);
    expect(response.status).toBe(202);
    expect(
      ((await response.json()) as { data: { twoFactorRequired: boolean } }).data.twoFactorRequired,
    ).toBe(true);

    await expectConcealed(
      await browser.json('/api/v1/admin/overview', 'GET'),
      await unknownAddressProblem(),
      'after the password alone',
    );
  });

  it('keeps an administrator without two-step sign-in out until they turn it on', async () => {
    await grantAdministrator(email);
    const browser = new Browser();
    const signIn = await browser.signIn(email);
    expect(signIn.status).toBe(200);
    const body = (await signIn.json()) as { data: { mfaEnabled: boolean; roles: string[] } };
    expect(body.data.mfaEnabled).toBe(false);
    expect(body.data.roles).toEqual(['admin', 'booker']);

    await expectConcealed(
      await browser.json('/api/v1/admin/overview', 'GET'),
      await unknownAddressProblem(),
      'without two-step sign-in',
    );

    await turnOnTwoFactor(browser);

    expect((await browser.json('/api/v1/admin/overview', 'GET')).status).toBe(200);
  });

  it("ends an administrator's session after 30 minutes without a request", async () => {
    const secret = await makeAdministratorWithTwoStep(email);
    const browser = await signInWithCode(email, secret);

    travel({ minutes: 29 });
    expect((await browser.json('/api/v1/admin/overview', 'GET')).status).toBe(200);
    travel({ minutes: 29 });
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(200);

    travel({ minutes: 31 });
    const ended = await browser.json('/api/v1/admin/overview', 'GET');

    expect(ended.status).toBe(401);
    expect(((await ended.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/unauthenticated`,
    );
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(401);
  });

  it("does not hold a booker's session to the administrator's limit", async () => {
    const browser = await signedIn(email);

    travel({ minutes: 31 });

    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(200);
  });

  it('refuses to let an administrator turn two-step sign-in off', async () => {
    const secret = await makeAdministratorWithTwoStep(email);
    const browser = await signInWithCode(email, secret);

    const response = await browser.json('/api/v1/account/two-factor', 'DELETE', {
      code: currentCode(secret),
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/two-factor-required`);
    expectContract(response, TURN_OFF, body);
    const [row] = await query<{ mfa_enabled: boolean }>(
      sql`select mfa_enabled from users where email = ${email}`,
    );
    expect(row?.mfa_enabled).toBe(true);
  });

  async function idOf(address: string): Promise<number> {
    const [row] = await query<{ id: number }>(sql`select id from users where email = ${address}`);
    return row?.id ?? 0;
  }
});
