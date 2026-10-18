import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { artistApplications } from '@/server/db/schema';
import {
  type ApplicationRejectionReason,
  ApplicationStatus,
  AuditAction,
  AuditOutcome,
} from '@/server/enums';
import { sendApplicationRejected } from '@/server/notifications/artist-onboarding/application-rejected';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';

/**
 * An administrator rejects an application (L2-048.2). Inside one transaction, with the application
 * locked, it needs the status Submitted; it stores the reason, the note and who decided when, and
 * audits the decision. After commit the applicant is emailed the reason and the note.
 *
 * @throws HttpProblem NotFound, or ApplicationAlreadyDecided once it is no longer Submitted
 */
export async function rejectArtistApplication(
  applicationId: number,
  decision: { reason: ApplicationRejectionReason; note: string | null },
  administrator: CurrentUser,
  request: NextRequest,
): Promise<void> {
  const applicant = await db().transaction(async (tx) => {
    const [application] = await tx
      .select({
        id: artistApplications.id,
        number: artistApplications.number,
        name: artistApplications.name,
        email: artistApplications.email,
        status: artistApplications.status,
      })
      .from(artistApplications)
      .where(eq(artistApplications.id, applicationId))
      .for('update');
    if (application === undefined) {
      throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
    }
    if (application.status !== ApplicationStatus.Submitted) {
      throw new HttpProblem(ProblemType.ApplicationAlreadyDecided, {
        detail: 'This application was already decided.',
      });
    }
    const at = now().toJSDate();
    await tx
      .update(artistApplications)
      .set({
        status: ApplicationStatus.Rejected,
        rejectionReason: decision.reason,
        rejectionNote: decision.note,
        decidedAt: at,
        decidedBy: administrator.id,
        updatedAt: at,
      })
      .where(eq(artistApplications.id, application.id));
    await recordAuditEntry(
      {
        actor: administrator,
        action: AuditAction.ApplicationRejected,
        target: { type: 'artist_application', id: application.id },
        outcome: AuditOutcome.Succeeded,
        context: { reason: decision.reason },
        request,
      },
      tx,
    );
    return application;
  });
  await sendApplicationRejected(
    { name: applicant.name, email: applicant.email },
    applicant.number,
    decision,
  );
}
