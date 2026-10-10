<?php

namespace App\Services\Discovery;

/**
 * Road distance in whole kilometres and drive time rounded to 5 minutes (L2-002). Approximate when
 * it was estimated from the straight line because routing was unavailable.
 */
final class Distance
{
    public function __construct(
        public readonly int $km,
        public readonly int $driveMinutes,
        public readonly bool $approximate = false,
    ) {}

    public static function fromRoute(int $metres, int $seconds, bool $approximate = false): self
    {
        return new self(
            (int) round($metres / 1000),
            (int) round($seconds / 60 / 5) * 5,
            $approximate,
        );
    }
}
