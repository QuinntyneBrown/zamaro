import { createHash, randomInt } from 'node:crypto';
import type { Transaction } from '@/server/db/client';
import { emailVerificationTokens } from '@/server/db/schema';
import { now } from '@/server/support/clock';

/**
 * A new single-use verification link's token, valid for 24 hours (L2-022.3). Only its SHA-256 is
 * stored; the plain token goes into the email and nowhere else.
 */
export const VERIFICATION_LIFETIME_HOURS = 24;

export async function issueEmailVerificationToken(
  tx: Transaction,
  userId: number,
): Promise<string> {
  const token = randomToken(64);
  await tx.insert(emailVerificationTokens).values({
    userId,
    tokenHash: sha256(token),
    expiresAt: now().plus({ hours: VERIFICATION_LIFETIME_HOURS }).toJSDate(),
  });
  return token;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** `length` letters and digits from a cryptographic source. */
export function randomToken(length: number): string {
  let token = '';
  for (let i = 0; i < length; i++) token += ALPHABET[randomInt(ALPHABET.length)] ?? '';
  return token;
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
