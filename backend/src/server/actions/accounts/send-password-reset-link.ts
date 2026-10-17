import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { sendResetPassword } from '@/server/notifications/accounts/reset-password';
import { issuePasswordResetToken } from './issue-password-reset-token';

/**
 * Emails a reset link when the address has an account (L2-023.3). Either way it returns the address
 * in lower case, so the answer never says which addresses have one.
 */
export async function sendPasswordResetLink(input: string): Promise<string> {
  const email = input.trim().toLowerCase();
  const issued = await db().transaction(async (tx) => {
    const [user] = await tx
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .for('update');
    if (user === undefined) return null;
    return { user, token: await issuePasswordResetToken(tx, user.id) };
  });
  if (issued !== null) {
    await sendResetPassword({ name: issued.user.name, email: issued.user.email }, issued.token);
  }
  return email;
}
