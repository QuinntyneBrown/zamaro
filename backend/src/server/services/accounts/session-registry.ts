import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
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
}

/** The browser's session is ending. */
export async function forgetSession(sessionId: string): Promise<void> {
  await db()
    .delete(userSessions)
    .where(eq(userSessions.id, sessionKey(sessionId)));
}

/** Ends every session of the account: each one's payload is destroyed, so its cookie is worth nothing. */
export async function endAllSessions(userId: number): Promise<void> {
  const rows = await db().select().from(userSessions).where(eq(userSessions.userId, userId));
  for (const row of rows) {
    await sessionStore().destroy(decryptField(row.encryptedSessionId));
  }
  await db().delete(userSessions).where(eq(userSessions.userId, userId));
}
