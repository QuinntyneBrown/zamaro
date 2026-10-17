import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { recoveryCodes, users } from '@/server/db/schema';
import { AuditAction, AuditOutcome, Role } from '@/server/enums';
import { sendTwoStepChanged } from '@/server/notifications/accounts/two-step-changed';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { replaceRecoveryCodes } from '@/server/services/accounts/recovery-codes';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType, ValidationProblem } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';
import {
  assertNotPaused,
  proveWithCode,
  recordRightAnswer,
  recordWrongAnswer,
} from './two-factor-proof';

export const WRONG_PROOF =
  'That code is wrong or has expired. Enter the code your app shows now, or an unused recovery code.';

/**
 * Turning two-step sign-in off, and new recovery codes (L2-072.5): each needs a current code from
 * the app or an unused recovery code first. Wrong codes count toward the 5-in-15-minutes pause, as
 * at sign-in. Each change is audited and emailed to the owner (M2 D21).
 *
 * @throws HttpProblem TwoFactorRequired when the person is an administrator (L2-066.2)
 * @throws HttpProblem SignInPaused
 * @throws ValidationProblem on `code` when it is wrong
 */
export async function turnOffTwoFactor(user: CurrentUser, code: string): Promise<void> {
  if (user.roles.includes(Role.Administrator)) {
    throw new HttpProblem(ProblemType.TwoFactorRequired, {
      detail: 'Administrators keep two-step sign-in on.',
    });
  }
  await prove(user, code);
  await db().transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        mfaEnabled: false,
        twoFactorSecret: null,
        twoFactorConfirmedAt: null,
        updatedAt: now().toJSDate(),
      })
      .where(eq(users.id, user.id));
    await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, user.id));
    await recordAuditEntry(
      {
        actor: user,
        action: AuditAction.TwoFactorDisabled,
        target: { type: 'user', id: user.id },
        outcome: AuditOutcome.Succeeded,
      },
      tx,
    );
  });
  await sendTwoStepChanged({ name: user.row.name, email: user.row.email }, 'off');
}

/** @returns the new codes, shown once */
export async function newRecoveryCodes(user: CurrentUser, code: string): Promise<string[]> {
  await prove(user, code);
  const codes = await db().transaction(async (tx) => {
    const replaced = await replaceRecoveryCodes(tx, user.id);
    await recordAuditEntry(
      {
        actor: user,
        action: AuditAction.RecoveryCodesReplaced,
        target: { type: 'user', id: user.id },
        outcome: AuditOutcome.Succeeded,
      },
      tx,
    );
    return replaced;
  });
  await sendTwoStepChanged({ name: user.row.name, email: user.row.email }, 'codes');
  return codes;
}

/** A current code, or an unused recovery code (which is used up). */
async function prove(user: CurrentUser, code: string): Promise<void> {
  await assertNotPaused(user);
  const { right } = await proveWithCode(user, { code });
  if (!right) {
    await recordAuditEntry({
      actor: user,
      action: AuditAction.SignInFailed,
      target: { type: 'user', id: user.id },
      outcome: AuditOutcome.Failed,
      context: { email: user.row.email.toLowerCase(), reason: 'two_factor_change' },
    });
    await recordWrongAnswer(user);
    throw new ValidationProblem({ code: [WRONG_PROOF] });
  }
  await recordRightAnswer(user);
}
