import type { NextRequest } from 'next/server';
import { AuditAction, AuditOutcome } from '@/server/enums';
import { sendAccountLocked } from '@/server/notifications/accounts/account-locked';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { useRecoveryCode } from '@/server/services/accounts/recovery-codes';
import {
  clearFailures,
  firstRefusal,
  pausedUntil,
  recordFailure,
} from '@/server/services/accounts/sign-in-throttle';
import { looksLikeTotp, verifyTotp } from '@/server/services/accounts/totp';
import { now, ZONE } from '@/server/support/clock';
import { decryptField } from '@/server/support/encryption/field-cipher';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';

/**
 * Proving it is you with two-step sign-in on: a current code from the app, or an unused recovery
 * code, which is used up. Wrong answers count toward the same 5-in-15-minutes pause as wrong
 * passwords (L2-072.4), and a paused address is refused before any check, its owner told once.
 */
export async function assertNotPaused(user: CurrentUser, request?: NextRequest): Promise<void> {
  const email = user.row.email.toLowerCase();
  const paused = await pausedUntil(email);
  if (paused === null) return;
  await recordAuditEntry({
    actor: user,
    action: AuditAction.SignInFailed,
    target: { type: 'user', id: user.id },
    outcome: AuditOutcome.Denied,
    context: { email, reason: 'paused' },
    ...(request !== undefined && { request }),
  });
  if (await firstRefusal(email, paused)) {
    await sendAccountLocked({ name: user.row.name, email: user.row.email }, paused);
  }
  const seconds = Math.max(1, Math.ceil(paused.diff(now(), 'seconds').seconds));
  throw new HttpProblem(ProblemType.SignInPaused, {
    detail: 'There were too many tries for this email. Try again later, or reset the password.',
    extensions: { pausedUntil: paused.setZone(ZONE).toISO() },
    headers: { 'Retry-After': String(seconds) },
  });
}

export type ProofMethod = 'code' | 'recovery_code';

/** Whether the answer proves it is the person; a recovery code that does is used up. */
export async function proveWithCode(
  user: CurrentUser,
  answer: { code?: string | undefined; recoveryCode?: string | undefined },
): Promise<{ right: boolean; method: ProofMethod }> {
  if (answer.recoveryCode !== undefined) {
    return { right: await useRecoveryCode(user.id, answer.recoveryCode), method: 'recovery_code' };
  }
  const code = answer.code ?? '';
  if (!looksLikeTotp(code)) {
    return { right: await useRecoveryCode(user.id, code), method: 'recovery_code' };
  }
  const secret = user.row.twoFactorSecret === null ? '' : decryptField(user.row.twoFactorSecret);
  return { right: secret !== '' && verifyTotp(secret, code), method: 'code' };
}

export async function recordWrongAnswer(user: CurrentUser): Promise<void> {
  await recordFailure(user.row.email.toLowerCase());
}

export async function recordRightAnswer(user: CurrentUser): Promise<void> {
  await clearFailures(user.row.email.toLowerCase());
}
