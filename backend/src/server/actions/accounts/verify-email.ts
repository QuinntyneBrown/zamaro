import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { emailVerificationTokens, users } from '@/server/db/schema';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { sha256 } from './issue-email-verification-token';

/**
 * Opens a verification link (L2-022.3): an unused token issued less than 24 hours ago marks its
 * owner's address verified and is used up. Anything else has expired, whichever reason, so the
 * answer says nothing about which tokens exist. Verifying does not sign anyone in.
 *
 * @returns the owner's name, for the page's thanks
 * @throws HttpProblem LinkExpired
 */
export function verifyEmail(token: string): Promise<{ name: string }> {
  return db().transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: emailVerificationTokens.id,
        userId: emailVerificationTokens.userId,
        expiresAt: emailVerificationTokens.expiresAt,
        usedAt: emailVerificationTokens.usedAt,
      })
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.tokenHash, sha256(token)))
      .for('update');
    const at = now().toJSDate();
    if (row?.usedAt !== null || row.expiresAt <= at) {
      throw new HttpProblem(ProblemType.LinkExpired, {
        detail: 'Ask for a new link and open it within 24 hours.',
      });
    }
    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: at })
      .where(eq(emailVerificationTokens.id, row.id));
    await tx
      .update(users)
      .set({ emailVerifiedAt: at })
      .where(and(eq(users.id, row.userId), isNull(users.emailVerifiedAt)));
    const [user] = await tx
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, row.userId));
    if (user === undefined) {
      throw new HttpProblem(ProblemType.LinkExpired, { detail: 'Ask for a new link.' });
    }
    return { name: user.name };
  });
}
