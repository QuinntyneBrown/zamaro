import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { disk } from '@/server/integrations/storage/disks';

/**
 * Copies the committed sample files to the media disk (M1 has no uploads or object storage): every
 * photo rendition and poster the cast refers to, and the one sample HLS stream with its captions
 * that every live video plays. Files that already exist are left alone, so running it again
 * changes nothing.
 */
export const SAMPLE_STREAM = 'samples/video/stream.m3u8';
export const SAMPLE_CAPTIONS = 'samples/video/captions.en.vtt';

const samples = fileURLToPath(new URL('media/', import.meta.url));

export async function seedMedia(): Promise<void> {
  const media = disk('media');
  const files = await readdir(samples, { recursive: true, withFileTypes: true });
  for (const file of files) {
    if (!file.isFile()) continue;
    const path = join(file.parentPath, file.name);
    const key = relative(samples, path)
      .split(sep)
      .join('/')
      .replace(/^sample-video\//, 'samples/video/');
    if (!(await media.exists(key))) {
      await media.put(key, await readFile(path));
    }
  }
}
