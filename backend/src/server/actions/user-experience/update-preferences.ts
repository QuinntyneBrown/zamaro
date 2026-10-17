import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import type { ThemePreference } from '@/server/enums';
import { loadCurrentUser, type CurrentUser } from '@/server/services/accounts/current-user';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';

/**
 * The theme chosen with the toggle, saved to the account so every device the person signs in on
 * follows it (L2-104.2); null follows the device again.
 */
export async function updateThemePreference(
  userId: number,
  theme: ThemePreference | null,
): Promise<CurrentUser> {
  await db()
    .update(users)
    .set({ themePreference: theme, updatedAt: now().toJSDate() })
    .where(eq(users.id, userId));
  const user = await loadCurrentUser(userId);
  if (user === null) {
    throw new HttpProblem(ProblemType.Unauthenticated, {
      detail: 'This needs a signed-in account.',
    });
  }
  return user;
}
