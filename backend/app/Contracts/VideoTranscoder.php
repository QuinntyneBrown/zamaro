<?php

namespace App\Contracts;

/**
 * The video processing service (L2-052.1, ADR-0002): reads a video's length and turns a clean
 * original into adaptive streaming renditions with a poster frame. The vendor is chosen in M10; until
 * then the fake answers from the file's bytes and writes the sample stream.
 */
interface VideoTranscoder
{
    /** How long the video on `$stream` (a readable resource) runs, in seconds. */
    public function probe(mixed $stream): int;

    /**
     * Transcodes the original at `$originalKey` on the originals disk into renditions under
     * `$outputPrefix` on the media disk, and answers where the manifest and poster landed.
     */
    public function transcode(string $originalKey, string $outputPrefix): TranscodeResult;
}
