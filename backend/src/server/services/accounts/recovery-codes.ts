import { createHash, randomInt } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db, type Database, type Transaction } from '@/server/db/client';
import { recoveryCodes } from '@/server/db/schema';
import { now } from '@/server/support/clock';

/**
 * Ten single-use codes for signing in without the phone (L2-072.3): "7kq4-m2xd". New codes replace
 * every earlier one; only their SHA-256 is stored, and each works once.
 */
export const RECOVERY_CODE_COUNT = 10;

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Replaces every code with new ones; answers the new codes, shown once. */
export async function replaceRecoveryCodes(
  tx: Database | Transaction,
  userId: number,
): Promise<string[]> {
  await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
  const codes = new Set<string>();
  while (codes.size < RECOVERY_CODE_COUNT) codes.add(newCode());
  await tx
    .insert(recoveryCodes)
    .values([...codes].map((code) => ({ userId, codeHash: hashRecoveryCode(code) })));
  return [...codes];
}

/** Uses up one unused code; false when it is unknown or was used. */
export async function useRecoveryCode(userId: number, code: string): Promise<boolean> {
  const used = await db()
    .update(recoveryCodes)
    .set({ usedAt: now().toJSDate() })
    .where(
      and(
        eq(recoveryCodes.userId, userId),
        eq(recoveryCodes.codeHash, hashRecoveryCode(code)),
        isNull(recoveryCodes.usedAt),
      ),
    )
    .returning({ id: recoveryCodes.id });
  return used.length === 1;
}

/** "7KQ4M2XD", "7kq4-m2xd" and " 7kq4 m2xd " are the same code. */
export function hashRecoveryCode(code: string): string {
  const clean = code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return createHash('sha256')
    .update(`${clean.slice(0, 4)}-${clean.slice(4)}`)
    .digest('hex');
}

function newCode(): string {
  let characters = '';
  for (let i = 0; i < 8; i++) characters += ALPHABET[randomInt(ALPHABET.length)] ?? '';
  return `${characters.slice(0, 4)}-${characters.slice(4)}`;
}
