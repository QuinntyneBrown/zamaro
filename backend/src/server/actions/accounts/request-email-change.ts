import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { emailChangeTokens, users } from '@/server/db/schema';
import { sendConfirmNewEmail } from '@/server/notifications/accounts/confirm-new-email';
import { sendEmailChanging } from '@/server/notifications/accounts/email-changing';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { now } from '@/server/support/clock';
import { ValidationProblem } from '@/server/support/problems';
import { randomToken, sha256 } from './issue-email-verification-token';

export const EMAIL_CHANGE_LIFETIME_HOURS = 24;

/**
 * Asks for a new account email (L2-025.1): the new address gets a link that works once, for 24
 * hours (M2 D11), and the current one a notice. The account email stays until the link is opened.
 * An address another account uses gets the same answer, no link and no pending change, so the form
 * never says which addresses have accounts. Earlier links stop working.
 *
 * @returns the new address in lower case
 */
export async function requestEmailChange(user: CurrentUser, input: string): Promise<string> {
  const email = input.trim().toLowerCase();
  if (email === user.row.email.toLowerCase()) {
    throw new ValidationProblem({ email: ['That is the address you sign in with already.'] });
  }

  const at = now();
  const token = await db().transaction(async (tx) => {
    await tx
      .update(emailChangeTokens)
      .set({ usedAt: at.toJSDate() })
      .where(and(eq(emailChangeTokens.userId, user.id), isNull(emailChangeTokens.usedAt)));
    const taken = await tx
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`);
    const free = taken.length === 0;
    await tx
      .update(users)
      .set({ pendingEmail: free ? email : null, updatedAt: at.toJSDate() })
      .where(eq(users.id, user.id));
    if (!free) return null;
    const plain = randomToken(64);
    await tx.insert(emailChangeTokens).values({
      userId: user.id,
      tokenHash: sha256(plain),
      newEmail: email,
      expiresAt: at.plus({ hours: EMAIL_CHANGE_LIFETIME_HOURS }).toJSDate(),
      createdAt: at.toJSDate(),
    });
    return plain;
  });

  if (token !== null) await sendConfirmNewEmail({ name: user.row.name, email }, token);
  await sendEmailChanging({ name: user.row.name, email: user.row.email }, email);
  return email;
}
