import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import type { NextRequest } from 'next/server';
import { db, type Transaction } from '@/server/db/client';
import { passwordResetTokens, users } from '@/server/db/schema';
import { AuditAction, AuditOutcome } from '@/server/enums';
import type { Session } from '@/server/http/session';
import { sendPasswordChanged } from '@/server/notifications/accounts/password-changed';
import { loadCurrentUser, type CurrentUser } from '@/server/services/accounts/current-user';
import { endAllSessions } from '@/server/services/accounts/session-registry';
import { now, ZONE } from '@/server/support/clock';
import { hashPassword } from '@/server/support/passwords';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';
import { sha256 } from './issue-email-verification-token';
import { startSession } from './sign-in';

export interface ResetLink {
  email: string;
  expiresAt: DateTime;
}

export type ResetOutcome =
  | { kind: 'signed-in'; user: CurrentUser }
  /** The password changed; with two-step sign-in on, the code step signs this browser in. */
  | { kind: 'two-factor'; email: string };

interface TokenRow {
  id: number;
  userId: number;
  email: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * Reset links (L2-023.3–.4): `checkResetLink` says whether one still works without using it;
 * `resetPassword` sets the new password with it, once, ends every session of the account, emails
 * its owner and signs this browser in. A link that was used or has run out names its account and
 * when it was sent; an unknown one names no one.
 */
export async function checkResetLink(token: string): Promise<ResetLink> {
  const row = await find(db(), token);
  assertUsable(row);
  return { email: row.email, expiresAt: DateTime.fromJSDate(row.expiresAt, { zone: ZONE }) };
}

export async function resetPassword(
  token: string,
  password: string,
  session: Session,
  request: NextRequest,
): Promise<ResetOutcome> {
  const hashed = await hashPassword(password);
  const user = await db().transaction(async (tx) => {
    const row = await find(tx, token, true);
    assertUsable(row);
    const at = now().toJSDate();
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: at })
      .where(eq(passwordResetTokens.id, row.id));
    await tx.update(users).set({ password: hashed }).where(eq(users.id, row.userId));
    await endAllSessions(row.userId, tx);
    const user = await loadCurrentUser(row.userId, tx);
    if (user === null) throw expired(null);
    await recordAuditEntry(
      {
        actor: user,
        action: AuditAction.PasswordReset,
        target: { type: 'user', id: user.id },
        outcome: AuditOutcome.Succeeded,
        request,
      },
      tx,
    );
    return user;
  });
  await sendPasswordChanged({ name: user.row.name, email: user.row.email }, now());

  if (user.row.mfaEnabled) {
    session.data.twoFactor = { userId: user.id, at: now().toSeconds() };
    return { kind: 'two-factor', email: user.row.email };
  }
  await startSession(user, session, request);
  return { kind: 'signed-in', user };
}

async function find(
  database: Transaction | ReturnType<typeof db>,
  token: string,
  lock = false,
): Promise<TokenRow> {
  const query = database
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      email: users.email,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
      createdAt: passwordResetTokens.createdAt,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(eq(passwordResetTokens.tokenHash, sha256(token)));
  const [row] = lock ? await query.for('update') : await query;
  if (row === undefined) throw expired(null);
  return row;
}

function assertUsable(row: TokenRow): void {
  if (row.usedAt !== null || row.expiresAt <= now().toJSDate()) throw expired(row);
}

/** 410: a link that existed names its account and when it was sent, so the page can offer a new one. */
function expired(row: TokenRow | null): HttpProblem {
  return new HttpProblem(ProblemType.LinkExpired, {
    detail: 'The link was used, has expired or is unknown.',
    ...(row !== null && {
      extensions: {
        email: row.email,
        sentAt: DateTime.fromJSDate(row.createdAt, { zone: ZONE }).toISO(),
      },
    }),
  });
}
