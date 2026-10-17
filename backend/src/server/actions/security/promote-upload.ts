import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { uploads, vulnerableSectorChecks } from '@/server/db/schema';
import { UploadPurpose, UploadStatus, VscStatus } from '@/server/enums';
import { disk } from '@/server/integrations/storage/disks';
import { storeDocument } from '@/server/services/artist-onboarding/document-vault';
import { now } from '@/server/support/clock';
import type { UploadRow } from './receive-upload';

/**
 * A clean upload leaves quarantine (L2-076.3): a Vulnerable Sector Check is encrypted into the
 * private documents disk through the document vault and its check waits for verification
 * (L2-049.1); other files move to the originals disk under a random name for their processing jobs.
 * The quarantine copy is deleted.
 */
export async function promoteUpload(upload: UploadRow, bytes: Buffer): Promise<void> {
  const at = now().toJSDate();
  await db().transaction(async (tx) => {
    let objectKey: string;
    if (upload.purpose === UploadPurpose.VscDocument) {
      const stored = await storeDocument(bytes);
      await tx
        .update(vulnerableSectorChecks)
        .set({
          status: VscStatus.Pending,
          storageKey: stored.key,
          wrappedDataKey: stored.wrappedDataKey,
          mimeType: upload.detectedMime,
          sizeBytes: upload.sizeBytes,
          updatedAt: at,
        })
        .where(eq(vulnerableSectorChecks.uploadId, upload.id));
      objectKey = stored.key;
    } else {
      objectKey = randomBytes(16).toString('hex');
      await disk('originals').put(objectKey, bytes);
    }
    await tx
      .update(uploads)
      .set({ status: UploadStatus.Clean, objectKey, scannedAt: at, updatedAt: at })
      .where(eq(uploads.id, upload.id));
  });
  if (upload.quarantineKey !== null) await disk('quarantine').delete(upload.quarantineKey);
}
