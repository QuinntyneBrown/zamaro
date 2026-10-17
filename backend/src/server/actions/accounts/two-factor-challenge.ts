import type { NextRequest } from 'next/server';
import { AuditAction, AuditOutcome } from '@/server/enums';
import type { Session } from '@/server/http/session';
import { loadCurrentUser, type CurrentUser } from '@/server/services/accounts/current-user';
import { markMfaVerified } from '@/server/services/administration/admin-session';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType, ValidationProblem } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';
import { startSession } from './sign-in';
import {
  assertNotPaused,
  proveWithCode,
  recordRightAnswer,
  recordWrongAnswer,
} from './two-factor-proof';

/**
 * The code step of signing in (L2-072.3–.4). The password step leaves a 10-minute marker in the
 * session instead of signing in; a current code, or an unused recovery code once, completes it with
 * a new session. Wrong codes count toward the same 5-in-15-minutes pause as wrong passwords.
 */
export const CHALLENGE_LIFETIME_MINUTES = 10;

export const WRONG_CODE = 'That code is wrong or has expired. Enter the code your app shows now.';
export const WRONG_RECOVERY_CODE =
  'That recovery code is wrong or was used. Enter another of your saved codes.';

interface Marker {
  userId: number;
  at: number;
}

/**
 * @throws HttpProblem Unauthenticated when no password step is waiting, or it ran out
 * @throws HttpProblem SignInPaused
 * @throws ValidationProblem on `code` or `recoveryCode` when it is wrong
 */
export async function completeTwoFactorChallenge(
  answer: { code?: string | undefined; recoveryCode?: string | undefined },
  session: Session,
  request: NextRequest,
): Promise<CurrentUser> {
  const user = await pendingUser(session);
  if (user === null) {
    delete session.data.twoFactor;
    throw new HttpProblem(ProblemType.Unauthenticated, {
      detail: 'Sign in with your password first.',
    });
  }

  await assertNotPaused(user, request);
  const { right, method } = await proveWithCode(user, answer);
  const email = user.row.email.toLowerCase();
  if (!right) {
    await recordAuditEntry({
      actor: user,
      action: AuditAction.MfaChallenge,
      target: { type: 'user', id: user.id },
      outcome: AuditOutcome.Failed,
      context: { email, method },
      request,
    });
    await recordWrongAnswer(user);
    throw new ValidationProblem(
      method === 'recovery_code' ? { recoveryCode: [WRONG_RECOVERY_CODE] } : { code: [WRONG_CODE] },
    );
  }

  delete session.data.twoFactor;
  await recordRightAnswer(user);
  await recordAuditEntry({
    actor: user,
    action: AuditAction.MfaChallenge,
    target: { type: 'user', id: user.id },
    outcome: AuditOutcome.Succeeded,
    context: { method },
    request,
  });
  await recordAuditEntry({
    actor: user,
    action: AuditAction.SignIn,
    target: { type: 'user', id: user.id },
    outcome: AuditOutcome.Succeeded,
    context: { two_factor: method },
    request,
  });
  await startSession(user, session, request);
  // The new session passed the code step; the administrator area requires that mark (L2-066.2).
  markMfaVerified(session);
  return user;
}

async function pendingUser(session: Session): Promise<CurrentUser | null> {
  const marker = session.data.twoFactor as Marker | undefined;
  if (marker === undefined) return null;
  if (now().toSeconds() - marker.at > CHALLENGE_LIFETIME_MINUTES * 60) return null;
  const user = await loadCurrentUser(marker.userId);
  return user?.row.mfaEnabled === true ? user : null;
}
