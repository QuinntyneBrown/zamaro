import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artistVideos, uploads } from '@/server/db/schema';
import { VideoStatus } from '@/server/enums';
import { videoTranscoder } from '@/server/integrations/bindings';
import { disk } from '@/server/integrations/storage/disks';
import { now } from '@/server/support/clock';
import { registerJob } from '../registry';

/**
 * A clean application video leaves the originals disk for the transcoder (L2-052.1): longer than 15
 * minutes it fails with its reason and the original is deleted; otherwise it comes back as a stream
 * manifest and a poster on the media disk and goes Live. Runs after the scan on the `uploads`
 * queue; a video already past Processing is left alone, so a retry is harmless (L2-092).
 */
export const PROCESS_APPLICATION_VIDEO_JOB = 'artist-onboarding.process-application-video';
export const MAX_VIDEO_SECONDS = 15 * 60;

registerJob(PROCESS_APPLICATION_VIDEO_JOB, async (payload) => {
  const { uploadId } = payload as { uploadId: string };
  const [upload] = await db().select().from(uploads).where(eq(uploads.id, uploadId));
  const [video] =
    upload === undefined
      ? []
      : await db().select().from(artistVideos).where(eq(artistVideos.uploadId, upload.id));
  if (upload?.objectKey == null || video?.status !== VideoStatus.Processing) return;

  const original = await disk('originals').get(upload.objectKey);
  if (original === null) throw new Error(`Upload ${upload.id} has no original file.`);
  const seconds = await videoTranscoder().probe(original);
  const at = now().toJSDate();

  if (seconds > MAX_VIDEO_SECONDS) {
    await disk('originals').delete(upload.objectKey);
    const minutes = Math.ceil(seconds / 60);
    await db()
      .update(artistVideos)
      .set({
        status: VideoStatus.Failed,
        originalKey: null,
        failureReason: `This video is ${String(minutes)} minutes long. Videos can be up to 15 minutes.`,
        updatedAt: at,
      })
      .where(eq(artistVideos.id, video.id));
    return;
  }

  const result = await videoTranscoder().transcode(
    upload.objectKey,
    `applications/videos/${video.id}`,
  );
  await db()
    .update(artistVideos)
    .set({
      status: VideoStatus.Live,
      originalKey: upload.objectKey,
      manifestKey: result.manifestKey,
      posterKey: result.posterKey,
      durationSeconds: result.durationSeconds,
      updatedAt: at,
    })
    .where(eq(artistVideos.id, video.id));
});
