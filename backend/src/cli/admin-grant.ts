import { sql } from 'drizzle-orm';
import { grantRole } from '@/server/actions/accounts/grant-role';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { Role } from '@/server/enums';
import { run } from './run';

/**
 * `npm run admin:grant -- <email>`: makes an account an administrator (M3 D6). Nothing in the
 * product grants the role, so the Zamaro team does it from the console; the grant is audited as
 * `user.role_changed` by the system. The admin API stays 404 to them until they turn two-step
 * sign-in on (L2-066.2).
 *
 * @returns the line the console prints
 */
export async function grantAdministrator(email: string): Promise<string> {
  const address = email.trim().toLowerCase();
  const [user] = await db()
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(sql`lower(${users.email}) = ${address}`);
  if (user === undefined) throw new Error(`No account has the address ${address}.`);
  await grantRole(user.id, Role.Administrator, null);
  return `${user.email} is now an administrator.`;
}

if (process.argv[1]?.endsWith('admin-grant.ts') === true) {
  const email = process.argv[2];
  run(async () => {
    if (email === undefined) throw new Error('Usage: npm run admin:grant -- <email>');
    console.log(await grantAdministrator(email));
  });
}
