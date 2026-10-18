import { asc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artistApplications } from '@/server/db/schema';
import { ApplicationStatus } from '@/server/enums';

export type ApplicationRow = typeof artistApplications.$inferSelect;

/** The Submitted applications, oldest first (L2-048, pages/admin-applications). */
export function listApplicationsWaiting(): Promise<ApplicationRow[]> {
  return db()
    .select()
    .from(artistApplications)
    .where(eq(artistApplications.status, ApplicationStatus.Submitted))
    .orderBy(asc(artistApplications.submittedAt), asc(artistApplications.id));
}
