import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import type { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { vulnerableSectorChecks } from '@/server/db/schema';
import { AuditAction, AuditOutcome, VscStatus } from '@/server/enums';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { now, today } from '@/server/support/clock';
import { HttpProblem, ProblemType, ValidationProblem } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';
import type { CheckRow } from './upload-vulnerable-sector-check';

/** A verified check counts for this long from its issue date (L2-049.2). */
export const VSC_VALID_YEARS = 3;

/**
 * An administrator verifies a check (L2-049.2): it counts for 3 years from its issue date, so one
 * issued more than 3 years ago is refused (M3 D11), and a check already decided is a conflict. The
 * decision is audited as `vsc.verified` in the same transaction.
 *
 * @throws HttpProblem VscAlreadyDecided, or NotFound for an unknown check
 * @throws ValidationProblem on `issuedOn` when the check is too old to count
 */
export function verifyVulnerableSectorCheck(
  checkId: number,
  administrator: CurrentUser,
  request: NextRequest,
): Promise<CheckRow> {
  return db().transaction(async (tx) => {
    const [check] = await tx
      .select()
      .from(vulnerableSectorChecks)
      .where(eq(vulnerableSectorChecks.id, checkId))
      .for('update');
    if (check === undefined) {
      throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
    }
    if (check.status !== VscStatus.Pending) {
      throw new HttpProblem(ProblemType.VscAlreadyDecided, {
        detail: 'This check was already decided.',
      });
    }
    const expiresOn =
      DateTime.fromISO(check.issuedOn).plus({ years: VSC_VALID_YEARS }).toISODate() ?? '';
    if (expiresOn < today()) {
      throw new ValidationProblem({
        issuedOn: ['This check was issued more than 3 years ago. Ask the artist for a newer one.'],
      });
    }
    const at = now().toJSDate();
    const [verified] = await tx
      .update(vulnerableSectorChecks)
      .set({
        status: VscStatus.Verified,
        verifiedAt: at,
        verifiedBy: administrator.id,
        expiresOn,
        updatedAt: at,
      })
      .where(eq(vulnerableSectorChecks.id, check.id))
      .returning();
    await recordAuditEntry(
      {
        actor: administrator,
        action: AuditAction.VscVerified,
        target: { type: 'vulnerable_sector_check', id: check.id },
        outcome: AuditOutcome.Succeeded,
        context: { expires_on: expiresOn },
        request,
      },
      tx,
    );
    if (verified === undefined) throw new Error('The check could not be updated.');
    return verified;
  });
}
