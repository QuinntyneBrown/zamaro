import { z } from 'zod';
import type { VideoRow } from '@/server/actions/artist-onboarding/application-videos';
import { VideoStatus, valuesOf } from '@/server/enums';
import { mediaUrl } from '@/server/support/media';

/**
 * An applicant's video as the upload row shows it (apply-as-artist, L2-052.2): how far it is, then
 * Processing, then Live with its length and poster, or why it failed.
 */
export const ApplicationVideoResource = z.object({
  /** The upload's token: the address of its chunks, its offset and its status, and what the application names. */
  token: z.string(),
  status: z.enum(valuesOf(VideoStatus)),
  title: z.string(),
  fileName: z.string(),
  /** The whole file, in bytes. */
  size: z.number().int(),
  /** How many bytes have arrived; the next chunk starts here. */
  offset: z.number().int(),
  /** Once Live: the length in seconds ("5:48"). */
  durationSeconds: z.number().int().nullable(),
  /** Once Live: the poster frame. */
  posterUrl: z.string().nullable(),
  /** Once failed: what the applicant reads. */
  failureReason: z.string().nullable(),
});

export const ApplicationVideoEnvelope = z.object({ data: ApplicationVideoResource });

export function toApplicationVideoResource(
  video: VideoRow,
): z.infer<typeof ApplicationVideoResource> {
  return {
    token: video.uploadToken ?? '',
    status: video.status,
    title: video.title,
    fileName: video.fileName ?? '',
    size: video.sizeBytes ?? 0,
    offset: video.uploadedBytes,
    durationSeconds: video.durationSeconds,
    posterUrl: video.posterKey === null ? null : mediaUrl(video.posterKey),
    failureReason: video.failureReason,
  };
}
