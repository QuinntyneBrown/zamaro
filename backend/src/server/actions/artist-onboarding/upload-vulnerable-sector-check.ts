import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { vulnerableSectorChecks } from '@/server/db/schema';
import { UploadPurpose, VscStatus } from '@/server/enums';
import { dispatchJob } from '@/server/jobs/dispatch';
import { SCAN_UPLOAD_JOB } from '@/server/jobs/security/scan-upload';
import { receiveUpload } from '../security/receive-upload';

export type CheckRow = typeof vulnerableSectorChecks.$inferSelect;

/**
 * An artist uploads a Police Vulnerable Sector Check with its issue date (L2-049.1). The file goes
 * through the upload pipeline; the check is `Scanning` until the scan passes, then waits for an
 * administrator. The check belongs to the person, not the artist row, so it survives either way.
 *
 * @throws ValidationProblem on `file` when the content is not a PDF, JPEG or PNG
 */
export async function uploadVulnerableSectorCheck(
  userId: number,
  bytes: Buffer,
  issuedOn: string,
): Promise<CheckRow> {
  const { check, uploadId } = await db().transaction(async (tx) => {
    const upload = await receiveUpload(tx, userId, bytes, UploadPurpose.VscDocument);
    const [created] = await tx
      .insert(vulnerableSectorChecks)
      .values({
        userId,
        uploadId: upload.id,
        issuedOn,
        expiresOn: null,
        status: VscStatus.Scanning,
      })
      .returning();
    if (created === undefined) throw new Error('The check could not be recorded.');
    return { check: created, uploadId: upload.id };
  });
  await dispatchJob('uploads', SCAN_UPLOAD_JOB, { uploadId });
  return check;
}

/**
 * Where the artist's checks stand: the most recent verified check, which Youth event searches
 * count, and the newest check of any status, which may be one still being scanned, waiting or
 * blocked. Either is null when there is none.
 */
export async function currentChecks(
  userId: number,
): Promise<{ verified: CheckRow | null; latest: CheckRow | null }> {
  const checks = await db()
    .select()
    .from(vulnerableSectorChecks)
    .where(eq(vulnerableSectorChecks.userId, userId))
    .orderBy(desc(vulnerableSectorChecks.createdAt), desc(vulnerableSectorChecks.id));
  return {
    verified: checks.find((check) => check.status === VscStatus.Verified) ?? null,
    latest: checks[0] ?? null,
  };
}
