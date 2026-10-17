import type { CurrentUser } from '@/server/services/accounts/current-user';
import { verifyPassword } from '@/server/support/passwords';
import { ValidationProblem } from '@/server/support/problems';

export const WRONG_PASSWORD = 'That password isn’t right. Check it and try again.';

/** A change to the email or password is confirmed with the current password (L2-025.1, L2-025.2). */
export async function assertCurrentPassword(user: CurrentUser, password: string): Promise<void> {
  if (!(await verifyPassword(user.row.password, password))) {
    throw new ValidationProblem({ currentPassword: [WRONG_PASSWORD] });
  }
}
