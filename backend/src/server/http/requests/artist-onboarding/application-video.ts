import { z } from 'zod';

/** What an applicant says about a video before its bytes arrive (apply-as-artist, L2-052.4). */
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;

const TITLE = 'Give the video a title of 5 to 100 characters.';

export const StartApplicationVideoUploadRequest = z.object({
  /** 5 to 100 characters: "Way Maker — live at Cornerstone". */
  title: z.string({ error: TITLE }).trim().min(5, TITLE).max(100, TITLE),
  /** The file's name as the browser knows it; the type is read from the bytes, never from this. */
  fileName: z
    .string({ error: 'Name the file.' })
    .min(1, 'Name the file.')
    .max(255, 'Use at most 255 characters.'),
  /** The whole file in bytes, up to 1 GB; the last chunk must bring the upload exactly here. */
  size: z
    .number({ error: 'Say how big the file is.' })
    .int('Say how big the file is.')
    .min(1, 'Say how big the file is.')
    .max(MAX_VIDEO_BYTES, 'Choose a video up to 1 GB.'),
});
