import { eq } from 'drizzle-orm';
import { db, type Database, type Transaction } from '@/server/db/client';
import { churches, roles, roleUser, users } from '@/server/db/schema';
import type { Role } from '@/server/enums';

export type UserRow = typeof users.$inferSelect;

/** The signed-in person with what the pipeline and the app need: their roles and their church. */
export interface CurrentUser {
  id: number;
  row: UserRow;
  /** Sorted by value: `['artist']`, `['booker']`, `['admin']`. */
  roles: Role[];
  church: { name: string; city: string; latitude: number; longitude: number } | null;
}

export async function loadCurrentUser(
  userId: number,
  database: Database | Transaction = db(),
): Promise<CurrentUser | null> {
  const [row] = await database.select().from(users).where(eq(users.id, userId));
  if (row === undefined) return null;
  const [held, [church]] = await Promise.all([
    database
      .select({ name: roles.name })
      .from(roleUser)
      .innerJoin(roles, eq(roles.id, roleUser.roleId))
      .where(eq(roleUser.userId, userId)),
    database
      .select({
        name: churches.name,
        city: churches.city,
        latitude: churches.latitude,
        longitude: churches.longitude,
      })
      .from(churches)
      .where(eq(churches.bookerId, userId)),
  ]);
  return {
    id: row.id,
    row,
    roles: held.map((role) => role.name as Role).sort(),
    church: church ?? null,
  };
}

/** The first letters of a person's first and last names: Naomi Fraser → "NF" (avatar CRD). */
export function initials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '');
  const first = words[0]?.charAt(0) ?? '';
  const last = words.length > 1 ? (words.at(-1)?.charAt(0) ?? '') : '';
  return `${first}${last}`.toUpperCase();
}
