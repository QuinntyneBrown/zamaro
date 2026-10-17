import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { TranscodeResult, VideoTranscoder } from '@/server/contracts/video-transcoder';
import { disk } from '@/server/integrations/storage/disks';

/**
 * The transcoder's fake (ADR-0002): a video runs `ZAMARO-DURATION=<seconds>` when its bytes say so,
 * else 5:48, and every transcode writes the seeders' sample stream and a one-pixel poster under the
 * output prefix.
 */
export class FakeVideoTranscoder implements VideoTranscoder {
  static readonly DEFAULT_SECONDS = 348;

  /** A 1×1 lossless WebP. */
  private static readonly POSTER = Buffer.from(
    'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAAAcQERGIiP4HAA==',
    'base64',
  );

  private static readonly SAMPLES = resolve(process.cwd(), 'database/seeders/media/sample-video');

  probe(bytes: Buffer): Promise<number> {
    const match = /ZAMARO-DURATION=(\d+)/.exec(bytes.subarray(0, 4096).toString('latin1'));
    return Promise.resolve(
      match?.[1] === undefined ? FakeVideoTranscoder.DEFAULT_SECONDS : Number(match[1]),
    );
  }

  async transcode(originalKey: string, outputPrefix: string): Promise<TranscodeResult> {
    const media = disk('media');
    for (const file of readdirSync(FakeVideoTranscoder.SAMPLES)) {
      if (file.endsWith('.vtt')) continue;
      await media.put(
        `${outputPrefix}/${file}`,
        readFileSync(join(FakeVideoTranscoder.SAMPLES, file)),
      );
    }
    await media.put(`${outputPrefix}/poster-800.webp`, FakeVideoTranscoder.POSTER);
    const original = await disk('originals').get(originalKey);
    const durationSeconds =
      original === null ? FakeVideoTranscoder.DEFAULT_SECONDS : await this.probe(original);
    return {
      manifestKey: `${outputPrefix}/stream.m3u8`,
      posterKey: `${outputPrefix}/poster-800.webp`,
      durationSeconds,
    };
  }
}
