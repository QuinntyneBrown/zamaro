import { eq, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { AuditAction, AuditOutcome } from '@/server/enums';
import type { Session } from '@/server/http/session';
import { loadCurrentUser, type CurrentUser } from '@/server/services/accounts/current-user';
import { forgetSession, registerSession } from '@/server/services/accounts/session-registry';
import {
  clearFailures,
  firstRefusal,
  pausedUntil,
  recordFailure,
} from '@/server/services/accounts/sign-in-throttle';
import { now, ZONE } from '@/server/support/clock';
import { dummyHash, verifyPassword } from '@/server/support/passwords';
import { HttpProblem, ProblemType, ValidationProblem } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';

export type SignInOutcome =
  | { kind: 'signed-in'; user: CurrentUser }
  /** The password was right; the code step completes the sign-in (L2-072.3). */
  | { kind: 'two-factor'; email: string };

/**
 * Checks an email and password and starts the session (L2-023.1). A wrong password and an unknown
 * email get the same answer (L2-023.2), and an unknown email is checked against a dummy hash so
 * both take as long. Every attempt is audited. After 5 failures for one address in 15 minutes, sign-in
 * for it is paused for 15 minutes, whatever the password (L2-072.4).
 */
export async function attemptSignIn(
  input: { email: string; password: string },
  session: Session,
  request: NextRequest,
): Promise<SignInOutcome> {
  const email = input.email.trim().toLowerCase();
  const [row] = await db()
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, email));
  const user = row === undefined ? null : await loadCurrentUser(row.id);
  const target = user === null ? null : { type: 'user', id: user.id };

  const paused = await pausedUntil(email);
  if (paused !== null) {
    await recordAuditEntry({
      actor: user,
      action: AuditAction.SignInFailed,
      target,
      outcome: AuditOutcome.Denied,
      context: { email, reason: 'paused' },
      request,
    });
    if (user !== null && (await firstRefusal(email, paused))) {
      // The owner is emailed once per pause; the email arrives with the notifications slice.
    }
    throw new HttpProblem(ProblemType.SignInPaused, {
      detail: 'There were too many tries for this email. Try again later, or reset the password.',
      extensions: { pausedUntil: paused.setZone(ZONE).toISO() },
    });
  }

  if (!(await verifyPassword(user?.row.password ?? (await dummyHash()), input.password))) {
    await recordAuditEntry({
      actor: user,
      action: AuditAction.SignInFailed,
      target,
      outcome: AuditOutcome.Failed,
      context: { email },
      request,
    });
    await recordFailure(email);
    throw new ValidationProblem({ credentials: ['Email or password is incorrect.'] });
  }
  if (user === null)
    throw new ValidationProblem({ credentials: ['Email or password is incorrect.'] });

  if (user.row.mfaEnabled) {
    session.data.twoFactor = { userId: user.id, at: now().toSeconds() };
    return { kind: 'two-factor', email: user.row.email };
  }

  await clearFailures(email);
  await recordAuditEntry({
    actor: user,
    action: AuditAction.SignIn,
    target,
    outcome: AuditOutcome.Succeeded,
    request,
  });
  await startSession(user, session, request);
  return { kind: 'signed-in', user };
}

/**
 * Signs a person in on this browser. The session gets a new ID, so one known before sign-in is
 * useless after it (session fixation, L2-073.1), and a new CSRF token. `startedAt` is when the
 * 30-day absolute limit starts; the session joins the account's registry.
 */
export async function startSession(
  user: CurrentUser,
  session: Session,
  request: NextRequest,
): Promise<void> {
  await session.regenerate();
  session.regenerateToken();
  session.data.userId = user.id;
  session.data.startedAt = now().toSeconds();
  delete session.data.twoFactor;
  await registerSession(user.id, session, request);
}

/**
 * Signs a person out of this browser (L2-023.5). The session is destroyed on the server, so the
 * cookie the browser held is worth nothing afterwards, and the CSRF token is rotated with it. The
 * session leaves the account's registry.
 */
export async function signOut(session: Session): Promise<void> {
  await forgetSession(session.id);
  await session.invalidate();
}
