import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { applicationReferences, artistApplications } from '@/server/db/schema';
import { ApplicationStatus, AuditAction, AuditOutcome } from '@/server/enums';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';

/**
 * An administrator ticks or unticks a reference (L2-048.1): it records who and when, or clears
 * both, and is audited as `application_reference.verified` in the same transaction. Only a
 * Submitted application's own references can change.
 *
 * @throws HttpProblem NotFound for an unknown application or a reference of another application
 * @throws HttpProblem ApplicationAlreadyDecided when the application is no longer Submitted
 * @returns the reference's id
 */
export function setReferenceVerification(
  applicationId: number,
  referenceId: number,
  verified: boolean,
  administrator: CurrentUser,
  request: NextRequest,
): Promise<number> {
  return db().transaction(async (tx) => {
    const [application] = await tx
      .select({ status: artistApplications.status })
      .from(artistApplications)
      .where(eq(artistApplications.id, applicationId))
      .for('update');
    const [reference] = await tx
      .select({ id: applicationReferences.id })
      .from(applicationReferences)
      .where(
        and(
          eq(applicationReferences.id, referenceId),
          eq(applicationReferences.artistApplicationId, applicationId),
        ),
      );
    if (application === undefined || reference === undefined) {
      throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
    }
    if (application.status !== ApplicationStatus.Submitted) {
      throw new HttpProblem(ProblemType.ApplicationAlreadyDecided, {
        detail: 'This application was already decided.',
      });
    }
    const at = now().toJSDate();
    await tx
      .update(applicationReferences)
      .set({
        verifiedAt: verified ? at : null,
        verifiedBy: verified ? administrator.id : null,
        updatedAt: at,
      })
      .where(eq(applicationReferences.id, reference.id));
    await recordAuditEntry(
      {
        actor: administrator,
        action: AuditAction.ReferenceVerified,
        target: { type: 'application_reference', id: reference.id },
        outcome: AuditOutcome.Succeeded,
        context: { application_id: applicationId, verified },
        request,
      },
      tx,
    );
    return reference.id;
  });
}
