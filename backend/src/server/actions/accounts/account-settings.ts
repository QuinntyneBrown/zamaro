import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists, users } from '@/server/db/schema';
import { loadCurrentUser, type CurrentUser } from '@/server/services/accounts/current-user';
import { now } from '@/server/support/clock';
import { decryptField, encryptField } from '@/server/support/encryption/field-cipher';
import { formatPhone, toE164 } from '@/server/support/phone';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { squish } from '@/server/support/strings';

/** Changes the account name; the header's initials follow it (L2-024.2). */
export async function renameAccount(userId: number, name: string): Promise<CurrentUser> {
  await db()
    .update(users)
    .set({ name: squish(name), updatedAt: now().toJSDate() })
    .where(eq(users.id, userId));
  const user = await loadCurrentUser(userId);
  if (user === null) {
    throw new HttpProblem(ProblemType.Unauthenticated, {
      detail: 'This needs a signed-in account.',
    });
  }
  return user;
}

/**
 * An artist's private contact phone (L2-025.4): encrypted at rest (L2-079.2), shown as
 * "905-555-0148", never on the public profile. An artist without a number yet reads null.
 */
export async function contactPhoneOf(userId: number): Promise<string | null> {
  const [artist] = await db()
    .select({ contactPhone: artists.contactPhone })
    .from(artists)
    .where(eq(artists.userId, userId));
  if (artist === undefined) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  return artist.contactPhone === null ? null : formatPhone(decryptField(artist.contactPhone));
}

export async function updateContactPhone(userId: number, phone: string): Promise<string> {
  const e164 = toE164(phone) ?? '';
  const updated = await db()
    .update(artists)
    .set({ contactPhone: encryptField(e164), updatedAt: now().toJSDate() })
    .where(eq(artists.userId, userId))
    .returning({ id: artists.id });
  if (updated.length === 0) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  return formatPhone(e164);
}
