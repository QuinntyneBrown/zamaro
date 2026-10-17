import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { AuditAction, AuditOutcome } from '@/server/enums';
import type { Session } from '@/server/http/session';
import { sendPasswordChanged } from '@/server/notifications/accounts/password-changed';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { endAllSessions, registerSession } from '@/server/services/accounts/session-registry';
import { now } from '@/server/support/clock';
import { hashPassword } from '@/server/support/passwords';
import { recordAuditEntry } from '../audit/record-audit-entry';

/**
 * A new password while signed in (L2-025.2): every other session of the account ends, and this one
 * gets a new ID and CSRF token, so a session ID known before the change is useless after it. The
 * owner is emailed, and the change is audited.
 */
export async function changePassword(
  user: CurrentUser,
  password: string,
  session: Session,
  request: NextRequest,
): Promise<void> {
  const hashed = await hashPassword(password);
  await db().transaction(async (tx) => {
    await tx
      .update(users)
      .set({ password: hashed, updatedAt: now().toJSDate() })
      .where(eq(users.id, user.id));
    await recordAuditEntry(
      {
        actor: user,
        action: AuditAction.PasswordChanged,
        target: { type: 'user', id: user.id },
        outcome: AuditOutcome.Succeeded,
        request,
      },
      tx,
    );
  });

  await endAllSessions(user.id);
  await session.regenerate();
  session.regenerateToken();
  await registerSession(user.id, session, request);
  await sendPasswordChanged({ name: user.row.name, email: user.row.email }, now());
}
