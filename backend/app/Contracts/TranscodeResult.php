<?php

namespace App\Contracts;

/** Where a transcoded video's stream manifest and poster frame sit on the media disk. */
final readonly class TranscodeResult
{
    public function __construct(public string $manifestKey, public string $posterKey, public int $durationSeconds) {}
}
