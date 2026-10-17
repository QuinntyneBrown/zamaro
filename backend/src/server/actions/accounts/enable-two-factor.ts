import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { AuditAction, AuditOutcome } from '@/server/enums';
import { sendTwoStepChanged } from '@/server/notifications/accounts/two-step-changed';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { replaceRecoveryCodes } from '@/server/services/accounts/recovery-codes';
import { newTotpSecret, verifyTotp } from '@/server/services/accounts/totp';
import { now } from '@/server/support/clock';
import { decryptField, encryptField } from '@/server/support/encryption/field-cipher';
import { HttpProblem, ProblemType, ValidationProblem } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';

export const CODE_DID_NOT_MATCH =
  'That code didn’t match. Codes change every 30 seconds; enter the one showing now.';

/**
 * Turning on two-step sign-in (L2-072.3): `beginTwoFactor` stores a new key, encrypted, that counts
 * for nothing yet; `confirmTwoFactor` checks the first code against it, turns two-step sign-in on and
 * answers 10 recovery codes, once. The owner is emailed (M2 D21) and the change is audited.
 *
 * @returns the new key, base32
 * @throws HttpProblem TwoFactorAlreadyOn
 */
export async function beginTwoFactor(user: CurrentUser): Promise<string> {
  assertOff(user);
  const secret = newTotpSecret();
  await db()
    .update(users)
    .set({
      twoFactorSecret: encryptField(secret),
      twoFactorConfirmedAt: null,
      updatedAt: now().toJSDate(),
    })
    .where(eq(users.id, user.id));
  return secret;
}

/** The key begun and not yet confirmed, or null. */
export function pendingSecret(user: CurrentUser): string | null {
  if (user.row.mfaEnabled || user.row.twoFactorSecret === null) return null;
  return decryptField(user.row.twoFactorSecret);
}

/**
 * @returns the recovery codes
 * @throws ValidationProblem on `code` when it does not match the key begun
 * @throws HttpProblem TwoFactorAlreadyOn
 */
export async function confirmTwoFactor(user: CurrentUser, code: string): Promise<string[]> {
  assertOff(user);
  const secret = pendingSecret(user);
  if (secret === null || !verifyTotp(secret, code)) {
    throw new ValidationProblem({ code: [CODE_DID_NOT_MATCH] });
  }
  const codes = await db().transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        mfaEnabled: true,
        twoFactorConfirmedAt: now().toJSDate(),
        updatedAt: now().toJSDate(),
      })
      .where(eq(users.id, user.id));
    const replaced = await replaceRecoveryCodes(tx, user.id);
    await recordAuditEntry(
      {
        actor: user,
        action: AuditAction.TwoFactorEnabled,
        target: { type: 'user', id: user.id },
        outcome: AuditOutcome.Succeeded,
      },
      tx,
    );
    return replaced;
  });
  await sendTwoStepChanged({ name: user.row.name, email: user.row.email }, 'on');
  return codes;
}

function assertOff(user: CurrentUser): void {
  if (user.row.mfaEnabled) {
    throw new HttpProblem(ProblemType.TwoFactorAlreadyOn, {
      detail: 'Two-step sign-in is already on.',
    });
  }
}
