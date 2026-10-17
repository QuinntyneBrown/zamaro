import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artistVideos, uploads, vulnerableSectorChecks } from '@/server/db/schema';
import { UploadStatus, VideoStatus, VscStatus } from '@/server/enums';
import { disk } from '@/server/integrations/storage/disks';
import { now } from '@/server/support/clock';
import type { UploadRow } from './receive-upload';
import { recordSecurityEvent } from './record-security-event';

/** What the applicant reads on the video's row (L2-052.2). */
export const INFECTED_VIDEO_REASON =
  'This file failed our malware scan and was deleted. Choose another video.';

/**
 * A file the scanner flagged (L2-076.2): the quarantine copy is deleted, the upload is rejected as
 * malware with the signature, the check it carried is blocked or the video it was fails with its
 * reason, and a security event is recorded. An artist's earlier verified check is untouched.
 */
export async function rejectInfectedUpload(upload: UploadRow, signature: string): Promise<void> {
  if (upload.quarantineKey !== null) await disk('quarantine').delete(upload.quarantineKey);
  const at = now().toJSDate();
  await db().transaction(async (tx) => {
    await tx
      .update(uploads)
      .set({
        status: UploadStatus.Rejected,
        rejectionReason: 'malware',
        scannerSignature: signature,
        scannedAt: at,
        updatedAt: at,
      })
      .where(eq(uploads.id, upload.id));
    await tx
      .update(vulnerableSectorChecks)
      .set({ status: VscStatus.Blocked, updatedAt: at })
      .where(eq(vulnerableSectorChecks.uploadId, upload.id));
    await tx
      .update(artistVideos)
      .set({ status: VideoStatus.Failed, failureReason: INFECTED_VIDEO_REASON, updatedAt: at })
      .where(eq(artistVideos.uploadId, upload.id));
  });
  recordSecurityEvent('upload.rejected_malware', {
    uploadId: upload.id,
    userId: upload.userId,
    purpose: upload.purpose,
    signature,
  });
}
