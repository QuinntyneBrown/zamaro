import { and, eq, ne, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/server/db/client';
import { emailChangeTokens, users } from '@/server/db/schema';
import { AuditAction, AuditOutcome } from '@/server/enums';
import { loadCurrentUser } from '@/server/services/accounts/current-user';
import { now, ZONE } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';
import { sha256 } from './issue-email-verification-token';

/**
 * Opens an email change link (L2-025.1): once, within 24 hours, and only while the new address is
 * still free, the account moves to it, verified. Anything else is the 410 `link-expired`; a link
 * that existed names the address the account still signs in with.
 *
 * @returns the address the account now signs in with
 */
export function confirmEmailChange(token: string): Promise<string> {
  return db().transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: emailChangeTokens.id,
        userId: emailChangeTokens.userId,
        newEmail: emailChangeTokens.newEmail,
        expiresAt: emailChangeTokens.expiresAt,
        usedAt: emailChangeTokens.usedAt,
        createdAt: emailChangeTokens.createdAt,
        email: users.email,
      })
      .from(emailChangeTokens)
      .innerJoin(users, eq(users.id, emailChangeTokens.userId))
      .where(eq(emailChangeTokens.tokenHash, sha256(token)))
      .for('update');
    if (row === undefined) throw expired();

    const at = now();
    const taken = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(sql`lower(${users.email}) = ${row.newEmail}`, ne(users.id, row.userId)));
    if (row.usedAt !== null || row.expiresAt <= at.toJSDate() || taken.length > 0) {
      throw expired(row.email, row.createdAt);
    }

    await tx
      .update(emailChangeTokens)
      .set({ usedAt: at.toJSDate() })
      .where(eq(emailChangeTokens.id, row.id));
    await tx
      .update(users)
      .set({
        email: row.newEmail,
        pendingEmail: null,
        emailVerifiedAt: at.toJSDate(),
        updatedAt: at.toJSDate(),
      })
      .where(eq(users.id, row.userId));
    const user = await loadCurrentUser(row.userId, tx);
    await recordAuditEntry(
      {
        actor: user,
        action: AuditAction.EmailChanged,
        target: { type: 'user', id: row.userId },
        outcome: AuditOutcome.Succeeded,
        context: { from: row.email, to: row.newEmail },
      },
      tx,
    );
    return row.newEmail;
  });
}

function expired(email?: string, sentAt?: Date): HttpProblem {
  return new HttpProblem(ProblemType.LinkExpired, {
    detail: 'The link was used, has expired or is unknown.',
    ...(email !== undefined &&
      sentAt !== undefined && {
        extensions: { email, sentAt: DateTime.fromJSDate(sentAt, { zone: ZONE }).toISO() },
      }),
  });
}
