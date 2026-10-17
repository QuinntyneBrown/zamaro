import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { auditEntries, users, userSessions } from '@/server/db/schema';
import { now } from '@/server/support/clock';
import { verify } from '@node-rs/argon2';
import { usePasswordVerifier } from '@/server/support/passwords';
import { Browser, CAST_PASSWORD, NAOMI, signedIn } from '../../support/accounts';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const SESSION = { method: 'post', path: '/session' };

/**
 * L2-023.1–.2: valid credentials start a session; invalid ones get one message whichever was wrong.
 * L2-072.2: passwords are hashed with Argon2id. L2-073.1: the session cookie is HttpOnly, Secure and
 * SameSite=Lax, and its ID changes at sign-in. L2-089.3: the answer is private and never stored.
 */
describe('signing in', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  afterEach(() => {
    usePasswordVerifier(undefined);
  });

  it('signs Naomi in with her email and password and answers her account', async () => {
    const browser = new Browser();

    const response = await browser.signIn(NAOMI);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({
      name: 'Naomi Fraser',
      email: NAOMI,
      initials: 'NF',
      roles: ['booker'],
      emailVerified: true,
    });
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('cache-control')).toContain('private');
    expect(browser.cookie('zamaro_session')).toBeDefined();
    expectContract(response, SESSION, body);
  });

  it('registers each session for the account by a hash of its id', async () => {
    await signedIn(NAOMI);
    await signedIn(NAOMI);

    const [naomi] = await db().select({ id: users.id }).from(users).where(eq(users.email, NAOMI));
    const sessions = await db()
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, naomi?.id ?? 0));
    expect(sessions).toHaveLength(2);
    for (const session of sessions) {
      expect(session.id).toMatch(/^[a-f0-9]{64}$/);
      expect(session.ipAddress).toBe('127.0.0.1');
      expect(session.lastActiveAt.getTime()).toBe(now().toMillis());
    }
  });

  it('matches the address whatever its case and surrounding spaces', async () => {
    const response = await new Browser().signIn('  Naomi.Fraser@RiversideCC.ca ');

    expect(response.status).toBe(200);
  });

  it('sets a session cookie that is http-only, secure and same-site lax', async () => {
    const browser = new Browser();

    const response = await browser.signIn(NAOMI);

    const cookie = response.headers
      .getSetCookie()
      .find((header) => header.startsWith('zamaro_session='));
    expect(cookie).toBeDefined();
    expect(cookie?.toLowerCase()).toContain('httponly');
    expect(cookie?.toLowerCase()).toContain('secure');
    expect(cookie?.toLowerCase()).toContain('samesite=lax');
  });

  it('changes the session id at sign-in', async () => {
    const browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');
    const before = browser.cookie('zamaro_session');

    await browser.json('/api/v1/session', 'POST', { email: NAOMI, password: CAST_PASSWORD });

    expect(before).toBeDefined();
    expect(browser.cookie('zamaro_session')).not.toBe(before);
  });

  it('gives a wrong password one message that does not say which was wrong', async () => {
    const browser = new Browser();

    const response = await browser.signIn(NAOMI, 'not-her-password-at-all');

    expect(response.status).toBe(422);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { errors: unknown };
    expect(body.errors).toEqual({ credentials: ['Email or password is incorrect.'] });
    expect((await browser.json('/api/v1/me', 'GET')).status).toBe(401);
    expectContract(response, SESSION, body);
  });

  it('gives an unknown email the same answer as a wrong password', async () => {
    const wrongPassword = (await (
      await new Browser().signIn(NAOMI, 'not-her-password-at-all')
    ).json()) as Record<string, unknown>;
    const unknownResponse = await new Browser().signIn(
      'nobody@riversidecc.ca',
      'not-her-password-at-all',
    );
    expect(unknownResponse.status).toBe(422);
    const unknownEmail = (await unknownResponse.json()) as Record<string, unknown>;

    delete wrongPassword.requestId;
    delete unknownEmail.requestId;
    expect(wrongPassword).toEqual(unknownEmail);
  });

  it('checks an unknown email against a dummy hash so it takes as long', async () => {
    let checks = 0;
    usePasswordVerifier((hashed, password) => {
      checks++;
      return verify(hashed, password).catch(() => false);
    });

    const response = await new Browser().signIn('nobody@riversidecc.ca', 'not-her-password-at-all');

    expect(response.status).toBe(422);
    expect(checks).toBe(1);
  });

  it('refuses an empty email or password before any check', async () => {
    const browser = new Browser();
    await browser.request('/api/v1/csrf-cookie');

    const response = await browser.json('/api/v1/session', 'POST', { email: '', password: '' });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(Object.keys(body.errors).sort()).toEqual(['email', 'password']);
    expectContract(response, SESSION, body);
  });

  it('writes each attempt to the audit log', async () => {
    await new Browser().signIn('nobody@riversidecc.ca', 'not-her-password-at-all');
    await new Browser().signIn(NAOMI);

    const [naomi] = await db().select({ id: users.id }).from(users).where(eq(users.email, NAOMI));
    const entries = await db().select().from(auditEntries).orderBy(auditEntries.id);
    expect(entries.map((entry) => entry.action)).toEqual(['auth.sign_in_failed', 'auth.sign_in']);
    expect(entries.map((entry) => entry.outcome)).toEqual(['failed', 'succeeded']);
    expect(entries[0]?.actorId).toBeNull();
    expect(entries[0]?.context).toMatchObject({ email: 'nobody@riversidecc.ca' });
    expect(entries[1]?.actorId).toBe(naomi?.id);
    expect(entries[1]?.actorRole).toBe('booker');
  });

  it('stores passwords as argon2id hashes', async () => {
    const [naomi] = await db()
      .select({ password: users.password })
      .from(users)
      .where(eq(users.email, NAOMI));

    expect(naomi?.password.startsWith('$argon2id$')).toBe(true);
    expect(naomi?.password).not.toBe(CAST_PASSWORD);
  });
});
