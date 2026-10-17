import { db } from '@/server/db/client';
import { AuditAction, AuditOutcome, type Role } from '@/server/enums';
import { loadCurrentUser, type CurrentUser } from '@/server/services/accounts/current-user';
import { grantRoles } from '@/server/services/accounts/roles';
import { recordAuditEntry } from '../audit/record-audit-entry';

/**
 * Gives someone a role they did not have, and audits the change (L2-069.1). `by` is the
 * administrator who did it, or null for the system: a console command or an automated step such as
 * an approval's job. Granting a role already held changes nothing and writes nothing.
 */
export async function grantRole(userId: number, role: Role, by: CurrentUser | null): Promise<void> {
  const user = await loadCurrentUser(userId);
  if (user === null) throw new Error(`No account has the id ${String(userId)}.`);
  if (user.roles.includes(role)) return;

  await db().transaction(async (tx) => {
    await grantRoles(tx, userId, [role]);
    await recordAuditEntry(
      {
        actor: by,
        action: AuditAction.RoleChanged,
        target: { type: 'user', id: userId },
        outcome: AuditOutcome.Succeeded,
        context: { granted: role },
      },
      tx,
    );
  });
}
