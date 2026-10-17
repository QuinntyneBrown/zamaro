import { inArray } from 'drizzle-orm';
import type { Database, Transaction } from '@/server/db/client';
import { roles, roleUser } from '@/server/db/schema';
import type { Role } from '@/server/enums';

/** Grants the roles a person does not hold yet; the ones they hold stay. */
export async function grantRoles(
  db: Database | Transaction,
  userId: number,
  names: Role[],
): Promise<void> {
  const ids = await db.select({ id: roles.id }).from(roles).where(inArray(roles.name, names));
  if (ids.length === 0) return;
  await db
    .insert(roleUser)
    .values(ids.map(({ id }) => ({ userId, roleId: id })))
    .onConflictDoNothing();
}
