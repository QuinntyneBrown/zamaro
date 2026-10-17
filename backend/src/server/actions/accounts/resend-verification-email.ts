import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { emailVerificationTokens, users } from '@/server/db/schema';
import { sendVerifyEmail } from '@/server/notifications/accounts/verify-email';
import { now } from '@/server/support/clock';
import { returnUrlOrDiscover } from '@/server/support/return-url';
import { issueEmailVerificationToken, sha256 } from './issue-email-verification-token';

export interface ResendRequest {
  /** The signed-in person's ID, if any; they are the recipient whatever else is sent. */
  signedInUserId: number | undefined;
  /** A guest's expired link: the new one goes to its owner. */
  token: string | null | undefined;
  /** A guest who has just signed up: the address they typed. */
  email: string | null | undefined;
  returnUrl: string | null | undefined;
}

interface Owner {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
}

/**
 * Sends a fresh verification link (L2-022.3) and revokes every earlier one. The person is the
 * signed-in booker, the owner of an expired link, or, just after signing up, the address they typed.
 * Nothing is sent to an unknown or already verified address, and the caller answers the same either
 * way.
 */
export async function resendVerificationEmail(request: ResendRequest): Promise<void> {
  const owner = await findOwner(request);
  if (owner?.emailVerifiedAt !== null) return;

  const token = await db().transaction(async (tx) => {
    // Used up rather than deleted, so an expired link still names its owner for the next resend.
    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: now().toJSDate() })
      .where(
        and(eq(emailVerificationTokens.userId, owner.id), isNull(emailVerificationTokens.usedAt)),
      );
    return issueEmailVerificationToken(tx, owner.id);
  });
  await sendVerifyEmail(
    { name: owner.name, email: owner.email },
    token,
    returnUrlOrDiscover(request.returnUrl),
  );
}

async function findOwner(request: ResendRequest): Promise<Owner | null> {
  const columns = {
    id: users.id,
    name: users.name,
    email: users.email,
    emailVerifiedAt: users.emailVerifiedAt,
  };
  if (request.signedInUserId !== undefined) {
    const [owner] = await db()
      .select(columns)
      .from(users)
      .where(eq(users.id, request.signedInUserId));
    return owner ?? null;
  }
  if (request.token !== null && request.token !== undefined) {
    const [owner] = await db()
      .select(columns)
      .from(users)
      .innerJoin(emailVerificationTokens, eq(emailVerificationTokens.userId, users.id))
      .where(eq(emailVerificationTokens.tokenHash, sha256(request.token)));
    return owner ?? null;
  }
  if (request.email !== null && request.email !== undefined) {
    const email = request.email.trim().toLowerCase();
    const [owner] = await db()
      .select(columns)
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`);
    return owner ?? null;
  }
  return null;
}
