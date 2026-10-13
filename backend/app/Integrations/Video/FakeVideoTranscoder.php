<?php

namespace App\Integrations\Video;

use App\Contracts\TranscodeResult;
use App\Contracts\VideoTranscoder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * The transcoder's fake (ADR-0002): a video runs `ZAMARO-DURATION=<seconds>` when its bytes say so,
 * else 5:48, and every transcode writes the seeders' sample stream and a one-pixel poster under the
 * output prefix.
 */
class FakeVideoTranscoder implements VideoTranscoder
{
    public const DEFAULT_SECONDS = 348;

    /** A 1×1 lossless WebP. */
    private const POSTER = "RIFF\x1a\x00\x00\x00WEBPVP8L\x0d\x00\x00\x00\x2f\x00\x00\x00\x00\x07\x10\x11\x11\x88\x88\xfe\x07\x00";

    public function probe(mixed $stream): int
    {
        $head = (string) fread($stream, 4096);

        return preg_match('/ZAMARO-DURATION=(\d+)/', $head, $match) === 1 ? (int) $match[1] : self::DEFAULT_SECONDS;
    }

    public function transcode(string $originalKey, string $outputPrefix): TranscodeResult
    {
        $media = Storage::disk(config('zamaro.media.disk'));
        $samples = database_path('seeders/media/sample-video');
        foreach (File::files($samples) as $file) {
            if ($file->getExtension() !== 'vtt') {
                $media->put("{$outputPrefix}/".$file->getFilename(), $file->getContents());
            }
        }
        $media->put("{$outputPrefix}/poster-800.webp", self::POSTER);
        $stream = Storage::disk(config('zamaro.uploads.disks.originals'))->readStream($originalKey);
        $seconds = $stream === null ? self::DEFAULT_SECONDS : $this->probe($stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return new TranscodeResult("{$outputPrefix}/stream.m3u8", "{$outputPrefix}/poster-800.webp", $seconds);
    }
}
