import { and, eq, isNull } from 'drizzle-orm';
import type { Transaction } from '@/server/db/client';
import { passwordResetTokens } from '@/server/db/schema';
import { now } from '@/server/support/clock';
import { randomToken, sha256 } from './issue-email-verification-token';

/**
 * A new single-use reset link's token, valid for 60 minutes (L2-023.3). Earlier links are used up,
 * so only the newest works. Only the SHA-256 is stored; the plain token goes into the email.
 */
export const RESET_LIFETIME_MINUTES = 60;

export async function issuePasswordResetToken(tx: Transaction, userId: number): Promise<string> {
  const at = now();
  await tx
    .update(passwordResetTokens)
    .set({ usedAt: at.toJSDate() })
    .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
  const token = randomToken(64);
  await tx.insert(passwordResetTokens).values({
    userId,
    tokenHash: sha256(token),
    expiresAt: at.plus({ minutes: RESET_LIFETIME_MINUTES }).toJSDate(),
    createdAt: at.toJSDate(),
  });
  return token;
}
