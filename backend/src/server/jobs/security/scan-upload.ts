import { eq } from 'drizzle-orm';
import { promoteUpload } from '@/server/actions/security/promote-upload';
import { rejectInfectedUpload } from '@/server/actions/security/reject-infected-upload';
import { db } from '@/server/db/client';
import { uploads } from '@/server/db/schema';
import { UploadPurpose, ScanVerdict, UploadStatus } from '@/server/enums';
import { mediaScanner } from '@/server/integrations/bindings';
import { disk } from '@/server/integrations/storage/disks';
import { PROCESS_APPLICATION_VIDEO_JOB } from '../artist-onboarding/process-application-video';
import { dispatchJob } from '../dispatch';
import { registerJob } from '../registry';

/**
 * Scans one quarantined upload (L2-076.1–.2) on the `uploads` queue. Clean files are promoted,
 * malware is rejected, and a scanner error throws so the job retries with backoff while the file
 * stays in quarantine (L2-092.1). An upload already past quarantine is left alone.
 */
export const SCAN_UPLOAD_JOB = 'security.scan-upload';

export interface ScanUploadPayload {
  uploadId: string;
}

registerJob(SCAN_UPLOAD_JOB, async (payload) => {
  const { uploadId } = payload as ScanUploadPayload;
  const [upload] = await db().select().from(uploads).where(eq(uploads.id, uploadId));
  if (upload?.status !== UploadStatus.Quarantined) return;
  const bytes =
    upload.quarantineKey === null ? null : await disk('quarantine').get(upload.quarantineKey);
  if (bytes === null) throw new Error(`Upload ${upload.id} has no quarantined file.`);

  const result = await mediaScanner().scan(bytes);
  switch (result.verdict) {
    case ScanVerdict.Clean:
      await promoteUpload(upload, bytes);
      // An application video goes on to the transcoder (apply-as-artist, L2-052.1).
      if (upload.purpose === UploadPurpose.Video) {
        await dispatchJob('uploads', PROCESS_APPLICATION_VIDEO_JOB, { uploadId: upload.id });
      }
      return;
    case ScanVerdict.Infected:
      await rejectInfectedUpload(upload, result.signature ?? 'unknown');
      return;
    case ScanVerdict.Error:
      throw new Error(`The scanner could not scan upload ${upload.id}.`);
  }
});
