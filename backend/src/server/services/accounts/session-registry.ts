import { createHash } from 'node:crypto';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { config } from '@config/zamaro';
import { db, type Database, type Transaction } from '@/server/db/client';
import { userSessions } from '@/server/db/schema';
import { clientAddress } from '@/server/http/client-address';
import type { Session } from '@/server/http/session';
import { ipLocator, sessionStore } from '@/server/integrations/bindings';
import { now } from '@/server/support/clock';
import { deviceLabel } from '@/server/support/device-label';
import { decryptField, encryptField } from '@/server/support/encryption/field-cipher';

/**
 * Every signed-in session of an account (accounts/sign-in-and-recover-access), so one can be ended
 * from elsewhere: a password reset ends them all (L2-023.4). Rows are keyed by the SHA-256 of the
 * session ID; the ID is kept encrypted only to destroy the session's payload.
 */
export function sessionKey(sessionId: string): string {
  return createHash('sha256').update(sessionId).digest('hex');
}

/** The browser's session, just started for the account, with its device and approximate city. */
export async function registerSession(
  userId: number,
  session: Session,
  request: NextRequest,
): Promise<void> {
  const address = clientAddress(request);
  await db()
    .insert(userSessions)
    .values({
      id: sessionKey(session.id),
      userId,
      encryptedSessionId: encryptField(session.id),
      deviceLabel: deviceLabel(request.headers.get('user-agent')),
      approximateCity: await ipLocator().city(address),
      ipAddress: address,
      lastActiveAt: now().toJSDate(),
    });
  session.data.lastActiveAt = now().toSeconds();
}

/** Activity is written at most this often, so a busy session does not write on every request (M2 D12). */
export const TOUCH_EVERY_MINUTES = 5;

export interface ActiveSession {
  id: string;
  deviceLabel: string | null;
  approximateCity: string | null;
  lastActiveAt: Date;
  isCurrent: boolean;
}

/**
 * The account's sessions still within their idle lifetime: this browser's first, then the most
 * recently active (L2-025.3).
 */
export async function activeSessions(
  userId: number,
  currentSessionId: string,
): Promise<ActiveSession[]> {
  const current = sessionKey(currentSessionId);
  const since = now().minus({ minutes: config().sessionLifetimeMinutes }).toJSDate();
  const rows = await db()
    .select({
      id: userSessions.id,
      deviceLabel: userSessions.deviceLabel,
      approximateCity: userSessions.approximateCity,
      lastActiveAt: userSessions.lastActiveAt,
    })
    .from(userSessions)
    .where(and(eq(userSessions.userId, userId), gte(userSessions.lastActiveAt, since)))
    .orderBy(sql`${userSessions.id} = ${current} desc`, desc(userSessions.lastActiveAt));
  return rows.map((row) => ({ ...row, isCurrent: row.id === current }));
}

/** Ends one of the account's sessions at once; false when they hold no session by that key (L2-074.2). */
export async function endSession(userId: number, key: string): Promise<boolean> {
  const [row] = await db()
    .select({ encryptedSessionId: userSessions.encryptedSessionId })
    .from(userSessions)
    .where(and(eq(userSessions.userId, userId), eq(userSessions.id, key)));
  if (row === undefined) return false;
  await sessionStore().destroy(decryptField(row.encryptedSessionId));
  await db().delete(userSessions).where(eq(userSessions.id, key));
  return true;
}

/**
 * Records that the browser's session is in use, at most every 5 minutes (M2 D12). The session
 * remembers when it last wrote, so a busy session costs no query between writes.
 */
export async function touchSession(session: Session): Promise<void> {
  const at = now();
  const last = session.data.lastActiveAt;
  if (typeof last === 'number' && at.toSeconds() - last < TOUCH_EVERY_MINUTES * 60) return;
  await db()
    .update(userSessions)
    .set({ lastActiveAt: at.toJSDate() })
    .where(eq(userSessions.id, sessionKey(session.id)));
  session.data.lastActiveAt = at.toSeconds();
}

/** The browser's session is ending. */
export async function forgetSession(sessionId: string): Promise<void> {
  await db()
    .delete(userSessions)
    .where(eq(userSessions.id, sessionKey(sessionId)));
}

/** Ends every session of the account: each one's payload is destroyed, so its cookie is worth nothing. */
export async function endAllSessions(
  userId: number,
  database: Database | Transaction = db(),
): Promise<void> {
  const rows = await database.select().from(userSessions).where(eq(userSessions.userId, userId));
  for (const row of rows) {
    await sessionStore().destroy(decryptField(row.encryptedSessionId));
  }
  await database.delete(userSessions).where(eq(userSessions.userId, userId));
}
