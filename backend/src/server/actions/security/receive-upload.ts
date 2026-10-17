import { randomUUID } from 'node:crypto';
import type { Transaction } from '@/server/db/client';
import { uploads } from '@/server/db/schema';
import { UploadStatus, type UploadPurpose } from '@/server/enums';
import { disk } from '@/server/integrations/storage/disks';
import {
  allowedTypes,
  detectContentType,
  wrongTypeMessage,
} from '@/server/services/security/content-type-detector';
import { ValidationProblem } from '@/server/support/problems';

export type UploadRow = typeof uploads.$inferSelect;

/**
 * The front door for every file (L2-076.1): its type is read from its content and checked against
 * the purpose's list, the bytes go to quarantine under a random name, and the row is written for the
 * scan the caller queues once its transaction commits. Nothing is served or processed before the
 * verdict.
 *
 * @throws ValidationProblem on `file` when the content is not a type the purpose accepts
 */
export async function receiveUpload(
  tx: Transaction,
  userId: number | null,
  bytes: Buffer,
  purpose: UploadPurpose,
): Promise<UploadRow> {
  const mime = detectContentType(bytes);
  if (mime === null || !allowedTypes(purpose).includes(mime)) {
    throw new ValidationProblem({ file: [wrongTypeMessage(purpose)] });
  }
  const key = randomUUID();
  await disk('quarantine').put(key, bytes);
  const [upload] = await tx
    .insert(uploads)
    .values({
      userId,
      purpose,
      detectedMime: mime,
      sizeBytes: bytes.byteLength,
      quarantineKey: key,
      status: UploadStatus.Quarantined,
    })
    .returning();
  if (upload === undefined) throw new Error('The upload could not be recorded.');
  return upload;
}
