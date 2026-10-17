import { randomBytes, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artistVideos, uploads } from '@/server/db/schema';
import { UploadPurpose, UploadStatus, VideoStatus } from '@/server/enums';
import { disk } from '@/server/integrations/storage/disks';
import { dispatchJob } from '@/server/jobs/dispatch';
import { SCAN_UPLOAD_JOB } from '@/server/jobs/security/scan-upload';
import {
  allowedTypes,
  detectContentType,
  wrongTypeMessage,
} from '@/server/services/security/content-type-detector';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType, ValidationProblem } from '@/server/support/problems';

export type VideoRow = typeof artistVideos.$inferSelect;

/** Parts of one upload sit under this prefix on the quarantine disk, named by their offset. */
export const PART_PREFIX = 'video-parts';

/**
 * An applicant names a video and how big it is, and gets the token every later chunk, the offset
 * question and the submission use (apply-as-artist, ADR-0026). The row has no artist and no
 * application yet; uploads:prune-unattached deletes it after 24 hours if neither arrives.
 */
export async function startVideoUpload(
  title: string,
  fileName: string,
  sizeBytes: number,
): Promise<VideoRow> {
  const [video] = await db()
    .insert(artistVideos)
    .values({
      position: 1,
      title,
      fileName,
      sizeBytes,
      uploadedBytes: 0,
      status: VideoStatus.Uploading,
      uploadToken: randomBytes(32).toString('hex'),
      // The API's clock, frozen in tests and e2e, so the 24-hour rule reads as the mocks do.
      createdAt: now().toJSDate(),
      updatedAt: now().toJSDate(),
    })
    .returning();
  if (video === undefined) throw new Error('The video could not be recorded.');
  return video;
}

export async function findVideoByToken(token: string): Promise<VideoRow | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const [video] = await db().select().from(artistVideos).where(eq(artistVideos.uploadToken, token));
  return video ?? null;
}

/**
 * One chunk of an applicant's video (ADR-0026): it must start where the upload ends, lands in
 * quarantine as its own part, and the last one hands the whole file to the upload pipeline. The row
 * is locked while a chunk is appended, so two chunks sent at once cannot both be accepted.
 *
 * @returns the offset after this chunk
 * @throws HttpProblem UploadOffsetMismatch when the chunk does not start where the upload ends
 * @throws ValidationProblem when the chunk runs past the declared size
 */
export async function appendVideoChunk(
  videoId: string,
  offset: number,
  chunk: Buffer,
): Promise<number> {
  const completed = await db().transaction(async (tx) => {
    const [video] = await tx
      .select()
      .from(artistVideos)
      .where(eq(artistVideos.id, videoId))
      .for('update');
    if (video === undefined) {
      throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
    }
    if (video.status !== VideoStatus.Uploading || offset !== video.uploadedBytes) {
      throw new HttpProblem(ProblemType.UploadOffsetMismatch, {
        detail: 'The chunk does not start where the upload ends.',
        headers: { 'Upload-Offset': String(video.uploadedBytes) },
      });
    }
    const end = offset + chunk.byteLength;
    const size = video.sizeBytes ?? 0;
    if (end > size) {
      throw new ValidationProblem({
        chunk: ['This chunk runs past the size the upload was started with.'],
      });
    }
    await disk('quarantine').put(partKey(video.uploadToken ?? '', offset), chunk);
    const [updated] = await tx
      .update(artistVideos)
      .set({ uploadedBytes: end, updatedAt: now().toJSDate() })
      .where(eq(artistVideos.id, video.id))
      .returning();
    return end === size ? (updated ?? null) : null;
  });
  if (completed !== null) await completeVideoUpload(completed);
  return offset + chunk.byteLength;
}

/**
 * The last chunk is in (ADR-0026): the parts become one quarantined file under a random name, typed
 * from its first bytes as every upload is (L2-076.1), and the scan is queued; the video is
 * Processing until the pipeline and the transcoder are done. A file that is not a video (or is
 * markup) fails here, with the reason the applicant reads, and leaves nothing behind.
 */
async function completeVideoUpload(video: VideoRow): Promise<void> {
  const quarantine = disk('quarantine');
  const token = video.uploadToken ?? '';
  const parts = (await quarantine.list(`${PART_PREFIX}/${token}`)).sort();
  const chunks: Buffer[] = [];
  for (const part of parts) {
    const bytes = await quarantine.get(part);
    if (bytes !== null) chunks.push(bytes);
  }
  const assembled = Buffer.concat(chunks);
  const mime = detectContentType(assembled);

  if (mime === null || !allowedTypes(UploadPurpose.Video).includes(mime)) {
    await deleteParts(parts);
    await db()
      .update(artistVideos)
      .set({
        status: VideoStatus.Failed,
        failureReason: wrongTypeMessage(UploadPurpose.Video),
        updatedAt: now().toJSDate(),
      })
      .where(eq(artistVideos.id, video.id));
    return;
  }

  const key = randomUUID();
  await quarantine.put(key, assembled);
  await deleteParts(parts);
  const uploadId = await db().transaction(async (tx) => {
    const [upload] = await tx
      .insert(uploads)
      .values({
        userId: null,
        purpose: UploadPurpose.Video,
        detectedMime: mime,
        sizeBytes: assembled.byteLength,
        quarantineKey: key,
        status: UploadStatus.Quarantined,
      })
      .returning({ id: uploads.id });
    if (upload === undefined) throw new Error('The upload could not be recorded.');
    await tx
      .update(artistVideos)
      .set({ status: VideoStatus.Processing, uploadId: upload.id, updatedAt: now().toJSDate() })
      .where(eq(artistVideos.id, video.id));
    return upload.id;
  });
  await dispatchJob('uploads', SCAN_UPLOAD_JOB, { uploadId });
}

export function partKey(token: string, offset: number): string {
  return `${PART_PREFIX}/${token}/${String(offset).padStart(12, '0')}`;
}

export async function deleteParts(parts: string[]): Promise<void> {
  for (const part of parts) await disk('quarantine').delete(part);
}
